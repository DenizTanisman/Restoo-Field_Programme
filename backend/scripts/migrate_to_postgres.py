"""SQLite verisini Postgres'e taşır.
Sıra önemli (FK constraints): bağımsız tablolar önce, dependents sonra.
"""
from sqlalchemy import create_engine, select, text
from sqlalchemy.orm import sessionmaker

from app.models import (
    AdminUser,
    Application,
    Category,
    Platform,
    District,
    Neighborhood,
    Restaurant,
    RestaurantPlatform,
    RestaurantMetrics,
    RestaurantAnalytics,
    DistrictAnalytics,
    NeighborhoodAnalytics,
    DistrictMetrics,
    NeighborhoodMetrics,
    Competitor,
    CaseStudy,
)
from app.models.metrics import SiteSettings


SQLITE_URL = "sqlite:///./opencard_dev.db"
PG_URL = "postgresql+psycopg2://opencard:opencard@localhost:5432/opencard"


# Bağımsızdan bağımlıya doğru sıralı
ORDERED_MODELS = [
    AdminUser,
    Category,
    Platform,
    District,
    Neighborhood,
    Application,
    SiteSettings,
    Restaurant,
    RestaurantPlatform,
    RestaurantMetrics,
    RestaurantAnalytics,
    DistrictAnalytics,
    NeighborhoodAnalytics,
    DistrictMetrics,
    NeighborhoodMetrics,
    Competitor,
    CaseStudy,
]


def _row_to_dict(row, model):
    """ORM nesnesini, FK ve scalar sütunlar dahil dict'e çevir."""
    return {c.name: getattr(row, c.name) for c in model.__table__.columns}


def main():
    src_engine = create_engine(SQLITE_URL, future=True)
    dst_engine = create_engine(PG_URL, future=True)

    SrcSession = sessionmaker(src_engine, expire_on_commit=False)
    DstSession = sessionmaker(dst_engine, expire_on_commit=False)

    total_rows = 0
    with SrcSession() as src, DstSession() as dst:
        # FK kontrolünü geçici devre dışı bırakmak gerekirse postgres'te
        # "SET session_replication_role = replica" — ama sıralı insert yeterli.
        for Model in ORDERED_MODELS:
            rows = src.execute(select(Model)).scalars().all()
            count = 0
            for r in rows:
                data = _row_to_dict(r, Model)
                dst.add(Model(**data))
                count += 1
            try:
                dst.commit()
            except Exception as e:
                dst.rollback()
                print(f"  ✗ {Model.__tablename__}: HATA — {e}")
                raise
            print(f"  ✓ {Model.__tablename__}: {count} satır")
            total_rows += count

        # Postgres SERIAL sequence'larını max(id)+1'e set et
        print("\n  Sequence'ları sıfırlıyorum…")
        for Model in ORDERED_MODELS:
            tbl = Model.__table__
            pk_cols = [c for c in tbl.columns if c.primary_key and c.autoincrement is True]
            for col in pk_cols:
                seq_name = f"{tbl.name}_{col.name}_seq"
                try:
                    # COALESCE(MAX(id), 0) + 1
                    dst.execute(text(
                        f"SELECT setval('{seq_name}', "
                        f"COALESCE((SELECT MAX({col.name}) FROM {tbl.name}), 0) + 1, false)"
                    ))
                    print(f"    {seq_name} → next")
                except Exception:
                    pass  # sequence yok (composite PK gibi)
        dst.commit()

    print(f"\n✓ Toplam {total_rows} satır taşındı.")


if __name__ == "__main__":
    main()
