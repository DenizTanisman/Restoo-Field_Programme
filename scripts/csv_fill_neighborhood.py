"""CSV (synthetic_csves/restaurants.csv) içine her satır için 'neighborhood_id' sütunu
ekler. Değer = restoranın district_id'sine ait alfabetik ilk mahallenin id'si.

DB'ye bağlanıp her ilçenin ilk mahallesini öğrenir, CSV'yi günceller.
"""
import csv
from pathlib import Path

import psycopg2

DB = dict(host="localhost", port=5432, user="opencard", password="opencard", dbname="opencard")
CSV_PATH = Path(__file__).parent.parent / "synthetic_csves" / "restaurants.csv"


def first_neighborhood_by_district() -> dict[str, int]:
    """Her district için alfabetik ilk neighborhood'un id'si."""
    conn = psycopg2.connect(**DB)
    cur = conn.cursor()
    cur.execute(
        """
        SELECT DISTINCT ON (district_id) district_id, id
        FROM neighborhoods
        WHERE is_active = TRUE
        ORDER BY district_id, name
        """
    )
    out = {row[0]: row[1] for row in cur.fetchall()}
    cur.close()
    conn.close()
    return out


def main():
    nb_by_district = first_neighborhood_by_district()
    print(f"  {len(nb_by_district)} ilçe için ilk mahalle eşleştirildi.")

    rows_in = list(csv.DictReader(CSV_PATH.open(encoding="utf-8")))
    if not rows_in:
        print("  CSV boş.")
        return
    first = rows_in[0]
    print(f"  Mevcut sütunlar: {list(first.keys())}")
    has_nb = "neighborhood_id" in first

    new_field = "neighborhood_id"
    out_fields = list(first.keys())
    if not has_nb:
        # 'category_id'den önce yerleştir (RESTAURANT_COLUMNS sırasıyla uyumlu)
        idx = out_fields.index("category_id")
        out_fields.insert(idx, new_field)

    filled = empty = 0
    rows_out = []
    for r in rows_in:
        nb_id = nb_by_district.get(r["district_id"])
        r[new_field] = str(nb_id) if nb_id is not None else ""
        if nb_id is not None:
            filled += 1
        else:
            empty += 1
        rows_out.append(r)

    with CSV_PATH.open("w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=out_fields)
        writer.writeheader()
        writer.writerows(rows_out)

    print(f"  CSV güncellendi → {CSV_PATH}")
    print(f"  Doldurulan: {filled}, boş: {empty}")


if __name__ == "__main__":
    main()
