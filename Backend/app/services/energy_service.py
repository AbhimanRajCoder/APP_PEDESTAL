"""
Energy service – Lightning Bolts energy economy system.

Handles:
- Time-based energy regeneration
- Energy consumption before lessons
- Configurable rates and caps
"""

from uuid import UUID
from datetime import datetime, timezone
from fastapi import HTTPException, status

from app.core.database import get_supabase
from app.core.constants import (
    DEFAULT_MAX_ENERGY,
    DEFAULT_REGEN_RATE,
    DEFAULT_REGEN_INTERVAL_SECONDS,
    MIN_ENERGY_TO_START,
)
from app.schemas.energy import (
    EnergyStatusResponse,
    EnergyConsumeRequest,
    EnergyConsumeResponse,
)


class EnergyService:
    """Manages the energy economy (Lightning Bolts) system."""

    def __init__(self):
        self.db = get_supabase()

    async def get_energy_status(self, user_profile_id: UUID) -> EnergyStatusResponse:
        """
        Get current energy with real-time regeneration calculation.

        Regeneration is computed lazily:
        1. Read last_updated and current_energy from DB
        2. Calculate elapsed intervals since last_updated
        3. Add regenerated energy (capped at max)
        4. Persist the new state
        """
        record = await self._get_or_create_energy(user_profile_id)
        record = await self._apply_regeneration(record)

        # Calculate time until full
        if record["current_energy"] >= record["max_energy"]:
            time_until_full = 0
            next_regen_at = datetime.now(timezone.utc)
        else:
            energy_deficit = record["max_energy"] - record["current_energy"]
            intervals_needed = (
                energy_deficit + record["regen_rate"] - 1
            ) // record["regen_rate"]  # ceil division
            time_until_full = intervals_needed * record["regen_interval_seconds"]

            last_updated = datetime.fromisoformat(
                record["last_updated"].replace("Z", "+00:00")
            )
            from datetime import timedelta
            next_regen_at = last_updated.replace(
                tzinfo=timezone.utc
            ) + timedelta(seconds=record["regen_interval_seconds"])

        return EnergyStatusResponse(
            current_energy=record["current_energy"],
            max_energy=record["max_energy"],
            regen_rate=record["regen_rate"],
            regen_interval_seconds=record["regen_interval_seconds"],
            next_regen_at=next_regen_at,
            time_until_full_seconds=time_until_full,
        )

    async def consume_energy(
        self, user_profile_id: UUID, request: EnergyConsumeRequest
    ) -> EnergyConsumeResponse:
        """
        Deduct energy before a lesson starts.

        Rules:
        - Apply regeneration first
        - Check if user has enough energy
        - Deduct and persist
        - Return failure (not exception) if insufficient
        """
        record = await self._get_or_create_energy(user_profile_id)
        record = await self._apply_regeneration(record)

        current = record["current_energy"]

        if current < request.amount:
            return EnergyConsumeResponse(
                success=False,
                energy_before=current,
                energy_after=current,
                amount_consumed=0,
                message=f"Insufficient energy. Need {request.amount}, have {current}. "
                f"Wait for regeneration or come back later!",
            )

        if current < MIN_ENERGY_TO_START:
            return EnergyConsumeResponse(
                success=False,
                energy_before=current,
                energy_after=current,
                amount_consumed=0,
                message="Energy too low to start a lesson.",
            )

        # Deduct energy with optimistic concurrency
        new_energy = current - request.amount
        now = datetime.now(timezone.utc).isoformat()

        self.db.table("user_energy").update(
            {
                "current_energy": new_energy,
                "last_updated": now,
            }
        ).eq("id", record["id"]).eq(
            "current_energy", current  # optimistic lock
        ).execute()

        return EnergyConsumeResponse(
            success=True,
            energy_before=current,
            energy_after=new_energy,
            amount_consumed=request.amount,
            message=f"⚡ {request.amount} energy consumed. {new_energy} remaining.",
        )

    async def _get_or_create_energy(self, user_profile_id: UUID) -> dict:
        """Get energy record, creating one with defaults if none exists."""
        result = (
            self.db.table("user_energy")
            .select("*")
            .eq("user_id", str(user_profile_id))
            .execute()
        )

        if result.data and len(result.data) > 0:
            return result.data[0]

        # Create default energy record
        now = datetime.now(timezone.utc).isoformat()
        insert_result = (
            self.db.table("user_energy")
            .insert(
                {
                    "user_id": str(user_profile_id),
                    "current_energy": DEFAULT_MAX_ENERGY,
                    "max_energy": DEFAULT_MAX_ENERGY,
                    "regen_rate": DEFAULT_REGEN_RATE,
                    "regen_interval_seconds": DEFAULT_REGEN_INTERVAL_SECONDS,
                    "last_updated": now,
                }
            )
            .execute()
        )

        return insert_result.data[0]

    async def _apply_regeneration(self, record: dict) -> dict:
        """
        Calculate and apply time-based energy regeneration.

        Uses elapsed time since last_updated to compute how many
        regen intervals have passed, then adds regen_rate per interval.
        """
        from datetime import timedelta

        now = datetime.now(timezone.utc)
        last_updated = datetime.fromisoformat(
            record["last_updated"].replace("Z", "+00:00")
        )
        if last_updated.tzinfo is None:
            last_updated = last_updated.replace(tzinfo=timezone.utc)

        elapsed_seconds = (now - last_updated).total_seconds()
        interval = record["regen_interval_seconds"]

        if elapsed_seconds < interval:
            return record  # No regen yet

        if record["current_energy"] >= record["max_energy"]:
            return record  # Already full

        # Calculate regen
        intervals_elapsed = int(elapsed_seconds // interval)
        energy_gained = intervals_elapsed * record["regen_rate"]
        new_energy = min(
            record["current_energy"] + energy_gained,
            record["max_energy"],
        )

        if new_energy != record["current_energy"]:
            # Persist regenerated energy
            self.db.table("user_energy").update(
                {
                    "current_energy": new_energy,
                    "last_updated": now.isoformat(),
                }
            ).eq("id", record["id"]).execute()

            record["current_energy"] = new_energy
            record["last_updated"] = now.isoformat()

        return record
