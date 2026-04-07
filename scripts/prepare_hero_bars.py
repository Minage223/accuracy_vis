import csv, json, random, os

def main():
    data = []
    with open('data/compas-scores-two-years.csv', 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            try:
                score = int(row.get('decile_score', 0))
                if score < 1 or score > 10:
                    continue
                # Apply the same ProPublica filter used in data_processing.py
                days = float(row.get('days_b_screening_arrest', 0))
                if days < -30 or days > 30:
                    continue
                if row.get('is_recid', '') == '-1':
                    continue
                if row.get('c_charge_degree', '') == 'O':
                    continue
                if row.get('score_text', '') == 'N/A':
                    continue
                data.append({
                    'id': len(data) + 1,
                    'age': int(row.get('age', 0)),
                    'sex': row.get('sex', 'Unknown'),
                    'race': row.get('race', 'Unknown'),
                    'priors_count': int(row.get('priors_count', 0)),
                    'decile_score': score,
                    'two_year_recid': row.get('two_year_recid') == '1',
                    'charge_degree': 'Felony' if row.get('c_charge_degree') == 'F' else 'Misdemeanor',
                })
            except (ValueError, KeyError):
                continue

    random.seed(42)
    random.shuffle(data)

    os.makedirs('public/data', exist_ok=True)
    with open('public/data/hero_bars_data.json', 'w') as f:
        json.dump(data, f)

    black = [d for d in data if d['race'] == 'African-American']
    white = [d for d in data if d['race'] == 'Caucasian']
    ba = sum(d['decile_score'] for d in black) / len(black) if black else 0
    wa = sum(d['decile_score'] for d in white) / len(white) if white else 0
    print(f'Total: {len(data)}')
    print(f'African-American: {len(black)}, avg score {ba:.2f}')
    print(f'Caucasian:        {len(white)}, avg score {wa:.2f}')
    print(f'Score gap: {ba - wa:.2f}')
    print('Saved to public/data/hero_bars_data.json')

if __name__ == '__main__':
    main()
