"""Static mapping of frontend lesson slugs to UUIDs."""

import uuid
LESSON_MAP = {
    "pf-c1-l1": {"uuid": "b38cc886-24db-527e-86aa-d6a1c3d3585c", "title": "What Is Money?"},
    "pf-c1-l2": {"uuid": "a01bcd16-79fc-5c71-b430-9c8207db6d82", "title": "Inflation & Purchasing Power"},
    "pf-c2-l1": {"uuid": "ac6289a3-4099-5e24-af93-43927e6abb62", "title": "50/30/20 Rule"},
    "pf-c2-l2": {"uuid": "8f046fc9-7032-5226-8a8c-1221c4b2380d", "title": "Tracking Expenses"},
    "pf-c3-l1": {"uuid": "495b20be-34a3-5d5f-9eb1-fed18295e949", "title": "Emergency Fund"},
    "pf-c3-l2": {"uuid": "ccba08a4-98ee-54b5-96f5-ef2c79ae1638", "title": "Pay Yourself First"},
    "pf-c4-l1": {"uuid": "920cf534-35e2-5988-b67d-55f089ec25c9", "title": "Understanding Debt"},
    "pf-c4-l2": {"uuid": "71dc7a0a-b9ed-5dfd-9aae-e07ec9c70e3b", "title": "Paying Off Debt"},
    "pf-c5-l1": {"uuid": "0eb35398-a4d6-52c7-a2d1-84647b365300", "title": "How Scores Work"},
    "pf-c5-l2": {"uuid": "36bb5c95-0121-5b3d-aa3c-0bd07ad39064", "title": "Improving Your Score"},
    "st-c1-l1": {"uuid": "cfc1bb1d-f2bc-5ebc-a107-8330398b65cf", "title": "What Is a Stock?"},
    "st-c1-l2": {"uuid": "033a247f-d404-596f-9040-e1895a69353d", "title": "Bull vs Bear Markets"},
    "st-c2-l1": {"uuid": "6179397a-d4cc-5339-9a99-07d232654902", "title": "Stock Exchanges"},
    "st-c2-l2": {"uuid": "ab4fdab7-d9b0-5458-95c9-d6dbc9983e75", "title": "Order Types"},
    "st-c3-l1": {"uuid": "ffd8a47e-f4d6-575a-ad9f-d23c3130138c", "title": "P/E Ratio"},
    "st-c3-l2": {"uuid": "c0005f5e-b6d8-5569-9ee8-7608ff66c156", "title": "Dividends"},
    "st-c4-l1": {"uuid": "bd2bf909-7dec-51b1-b0fe-16beb07c0052", "title": "Diversification"},
    "st-c4-l2": {"uuid": "fdac28eb-8d23-56ca-bb1b-3fa82a5ce78d", "title": "Volatility"},
    "st-c5-l1": {"uuid": "a301be26-e9a7-5b33-8c9d-3ca7b6c36c39", "title": "Value vs Growth"},
    "st-c5-l2": {"uuid": "7dd89adb-a252-58dd-8341-631242acc89e", "title": "Long-Term vs Short-Term"},
    "in-c1-l1": {"uuid": "8b5dbbd3-b0ee-5159-b411-5c6bb772fdad", "title": "What Are Mutual Funds?"},
    "in-c1-l2": {"uuid": "749b7d8b-52f3-5ffb-84e7-71d4ec855177", "title": "Active vs Passive Funds"},
    "in-c2-l1": {"uuid": "f6a0808f-80b1-5a46-84ab-16b3690b9cd3", "title": "How SIPs Work"},
    "in-c2-l2": {"uuid": "df05d5db-0a27-5132-9d36-725bb7498af1", "title": "Choosing the Right SIP"},
    "in-c3-l1": {"uuid": "9a168dd3-330a-57a1-8575-306b672f5f13", "title": "Power of Compounding"},
    "in-c3-l2": {"uuid": "304cbf51-188b-594f-854b-7d6073055749", "title": "Starting Early"},
    "in-c4-l1": {"uuid": "4428d6dd-2817-5dbf-9ea2-693407b8ef30", "title": "Gold & REITs"},
    "in-c4-l2": {"uuid": "a0494ab4-086c-51c8-92fa-6f324bb080e4", "title": "Bonds"},
    "in-c5-l1": {"uuid": "92fa120e-4a3f-5b43-98c5-ad8467d6856d", "title": "Asset Allocation"},
    "in-c5-l2": {"uuid": "7c713c6b-a702-5bec-bb9c-9c6185ffa99d", "title": "Rebalancing"},
    "td-c1-l1": {"uuid": "c0979224-42a6-52c9-9ddd-80fa20716a49", "title": "Income Tax Slabs"},
    "td-c1-l2": {"uuid": "118d471a-6859-583a-827f-4880e6db4a66", "title": "TDS & Advance Tax"},
    "td-c2-l1": {"uuid": "5ac66c90-b3cb-5584-a9d5-22154eb39695", "title": "Section 80C"},
    "td-c2-l2": {"uuid": "74d56302-8823-54b8-a148-ee336684a7e1", "title": "HRA & Other Deductions"},
    "td-c3-l1": {"uuid": "cb6e3c5f-827d-54a2-bda4-fd32b7272315", "title": "STCG vs LTCG"},
    "td-c3-l2": {"uuid": "0c0a1b34-74ae-52c6-91fc-6cbe31839299", "title": "Tax Harvesting"},
    "td-c4-l1": {"uuid": "ccdd4044-0fa9-5458-9b8b-95b0e7b1246d", "title": "EMI and Interest"},
    "td-c4-l2": {"uuid": "b789bd92-6596-52d4-8035-f4a11f2a42b8", "title": "Loan Against Assets"},
    "td-c5-l1": {"uuid": "53aafc04-858b-592b-abd9-af2164ac9803", "title": "Term Life Insurance"},
    "td-c5-l2": {"uuid": "d0b2c742-c726-5501-9d08-dcb4461c5833", "title": "Health Insurance"},
    "w-c1-l1": {"uuid": "7a1118f8-d4f3-55bc-aa55-d8cc85bb3131", "title": "Types of Passive Income"},
    "w-c1-l2": {"uuid": "d0926997-444f-58f7-beba-eb22cea732d7", "title": "Dividend Investing"},
    "w-c2-l1": {"uuid": "7ac1f7be-b302-597b-ae31-d9d71f69c1dd", "title": "Real Estate Fundamentals"},
    "w-c2-l2": {"uuid": "73968093-94b0-5e06-9abf-59464b2012e7", "title": "REITs vs Direct Property"},
    "w-c3-l1": {"uuid": "9cce94e4-037c-510c-86d6-d4ee7d635cfb", "title": "F.I.R.E. Movement"},
    "w-c3-l2": {"uuid": "ecd62445-9d92-5723-b8e1-5bf203fd7690", "title": "Savings Rate Matters Most"},
    "w-c4-l1": {"uuid": "d5ec95ba-45d0-5224-807b-bad534d0951e", "title": "Cognitive Biases"},
    "w-c4-l2": {"uuid": "83eadb7d-99e9-59cd-868b-18a4cb365ae3", "title": "Market Psychology"},
    "w-c5-l1": {"uuid": "47fcf80b-6122-5f8f-be56-81e50176877c", "title": "Will & Nomination"},
    "w-c5-l2": {"uuid": "23a2b02c-87e4-52c5-be2c-693249ccd281", "title": "Generational Wealth"},
}

def get_uuid(slug: str) -> str:
    return LESSON_MAP.get(slug, {}).get("uuid", str(uuid.uuid5(uuid.NAMESPACE_DNS, slug)))

def get_slug(u: str) -> str:
    for slug, data in LESSON_MAP.items():
        if data["uuid"] == str(u):
            return slug
    return str(u)

def get_title(u: str) -> str:
    for slug, data in LESSON_MAP.items():
        if data["uuid"] == str(u):
            return data["title"]
    return "Unknown Lesson"
