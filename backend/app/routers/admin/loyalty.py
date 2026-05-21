"""Loyalty (SiteSettings) admin endpoints — JSON upsert + CSV import/export.

CSV'de görsel URL'leri yok (loyalty_hero_bg_url ve card_N_image_url) —
bunlar admin'den ayrı upload edilir.

Feature cards: DB'de JSON list of {title, text, image_url}; CSV'de 6 sabit slot
× 2 alan (title, text) = 12 sütun.
"""
from __future__ import annotations

from fastapi import APIRouter, Depends, File, Response, UploadFile
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import SiteSettings
from app.services.csv_service import LOYALTY_COLUMNS, parse_csv_upload, rows_to_csv
from app.services.metric_schemas import FEATURE_CARD_SLOTS


router = APIRouter(prefix="/loyalty", tags=["Admin · Loyalty"])


# ============================================================================
# Skaler ayar alanları (görsel olanlar HARİÇ — onlar JSON üzerinden gelir)
# ============================================================================
_LOYALTY_SCALAR_FIELDS = (
    "loyalty_active_firms", "loyalty_churn_reduction",
    "loyalty_avg_roi", "loyalty_payback_period",
    "loyalty_stats_active_firms_label", "loyalty_stats_churn_label",
    "loyalty_stats_roi_label", "loyalty_stats_payback_label",
    "loyalty_hero_bg_url", "loyalty_hero_badge",
    "loyalty_hero_title", "loyalty_hero_title_accent",
    "loyalty_hero_subtitle", "loyalty_hero_cta_text",
    "loyalty_features_title", "loyalty_features_subtitle",
)


# ============================================================================
# JSON Upsert (admin form için)
# ============================================================================
class LoyaltyUpsert(BaseModel):
    loyalty_active_firms: str = ""
    loyalty_churn_reduction: str = ""
    loyalty_avg_roi: str = ""
    loyalty_payback_period: str = ""
    loyalty_stats_active_firms_label: str = ""
    loyalty_stats_churn_label: str = ""
    loyalty_stats_roi_label: str = ""
    loyalty_stats_payback_label: str = ""
    loyalty_hero_bg_url: str = ""
    loyalty_hero_badge: str = ""
    loyalty_hero_title: str = ""
    loyalty_hero_title_accent: str = ""
    loyalty_hero_subtitle: str = ""
    loyalty_hero_cta_text: str = ""
    loyalty_features_title: str = ""
    loyalty_features_subtitle: str = ""
    loyalty_feature_cards: list[dict] = []


@router.get("")
async def get_loyalty(db: AsyncSession = Depends(get_db)):
    row = (await db.execute(select(SiteSettings).where(SiteSettings.id == 1))).scalar_one_or_none()
    if not row:
        return {f: "" for f in _LOYALTY_SCALAR_FIELDS} | {"loyalty_feature_cards": []}
    out = {f: (getattr(row, f, "") or "") for f in _LOYALTY_SCALAR_FIELDS}
    out["loyalty_feature_cards"] = list(row.loyalty_feature_cards or [])
    return out


@router.post("")
async def upsert_loyalty(payload: LoyaltyUpsert, db: AsyncSession = Depends(get_db)):
    row = (await db.execute(select(SiteSettings).where(SiteSettings.id == 1))).scalar_one_or_none()
    if row:
        for k, v in payload.model_dump().items():
            setattr(row, k, v)
    else:
        db.add(SiteSettings(id=1, **payload.model_dump()))
    await db.commit()
    return {"ok": True}


# ============================================================================
# CSV Export — tek satır
# ============================================================================
def _loyalty_to_csv_row(row: SiteSettings | None) -> dict:
    out: dict = {f: "" for f in LOYALTY_COLUMNS}
    if row is None:
        return out
    for f in _LOYALTY_SCALAR_FIELDS:
        # bg_url CSV'de yok — skip
        if f == "loyalty_hero_bg_url":
            continue
        if f in LOYALTY_COLUMNS:
            out[f] = getattr(row, f, "") or ""
    cards = row.loyalty_feature_cards or []
    for i in range(1, FEATURE_CARD_SLOTS + 1):
        if i <= len(cards) and isinstance(cards[i - 1], dict):
            out[f"card_{i}_title"] = cards[i - 1].get("title", "") or ""
            out[f"card_{i}_text"] = cards[i - 1].get("text", "") or ""
    return out


@router.get("/csv", response_class=Response)
async def export_loyalty_csv(db: AsyncSession = Depends(get_db)):
    row = (await db.execute(select(SiteSettings).where(SiteSettings.id == 1))).scalar_one_or_none()
    csv_text = rows_to_csv([_loyalty_to_csv_row(row)], LOYALTY_COLUMNS)
    return Response(
        content=csv_text,
        media_type="text/csv",
        headers={"Content-Disposition": 'attachment; filename="loyalty.csv"'},
    )


# ============================================================================
# CSV Import — ilk satır kullanılır (tek satır CSV)
# ============================================================================
@router.post("/csv", response_model=dict)
async def import_loyalty_csv(file: UploadFile = File(...), db: AsyncSession = Depends(get_db)):
    """CSV'de görsel alanları yok; bg_url ve card_N_image_url dokunulmaz."""
    records, warnings = await parse_csv_upload(file, LOYALTY_COLUMNS)
    if not records:
        return {"updated": False, "warnings": warnings, "errors": ["CSV boş"]}

    row = (await db.execute(select(SiteSettings).where(SiteSettings.id == 1))).scalar_one_or_none()
    if row is None:
        row = SiteSettings(id=1)
        db.add(row)
        await db.flush()

    first = records[0]
    for f in _LOYALTY_SCALAR_FIELDS:
        if f == "loyalty_hero_bg_url":
            continue  # CSV'de yok, dokunma
        if f in LOYALTY_COLUMNS:
            setattr(row, f, (first.get(f) or "").strip())

    # Feature cards — mevcut image_url'leri koruyarak slot'tan oluştur
    existing_cards = list(row.loyalty_feature_cards or [])
    new_cards: list[dict] = []
    for i in range(1, FEATURE_CARD_SLOTS + 1):
        title = (first.get(f"card_{i}_title") or "").strip()
        text = (first.get(f"card_{i}_text") or "").strip()
        if not title and not text:
            continue
        image_url = ""
        if i - 1 < len(existing_cards) and isinstance(existing_cards[i - 1], dict):
            image_url = existing_cards[i - 1].get("image_url", "") or ""
        new_cards.append({"title": title, "text": text, "image_url": image_url})
    row.loyalty_feature_cards = new_cards

    await db.commit()
    return {
        "updated": True,
        "feature_cards_count": len(new_cards),
        "warnings": warnings,
    }
