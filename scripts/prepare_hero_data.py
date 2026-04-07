import csv, json, random

data = []
with open('data/compas-scores-two-years.csv', 'r') as f:
    reader = csv.DictReader(f)
    for row in reader:
        if row.get('decile_score') and row.get('race') in ['African-American', 'Caucasian']:
            try:
                int(row['decile_score'])
                data.append(row)
            except:
                pass

random.seed(42)
sampled = random.sample(data, min(50, len(data)))

nodes = []
for i, person in enumerate(sampled):
    score = int(person['decile_score'])
    nodes.append({
        'id': f'Person {chr(65 + i % 26)}{i // 26 + 1}',
        'age': int(person.get('age', 0)),
        'sex': person.get('sex', 'Unknown'),
        'race': person.get('race', 'Unknown'),
        'priors_count': int(person.get('priors_count', 0)),
        'decile_score': score,
        'risk_level': 'Low' if score <= 4 else 'Medium' if score <= 7 else 'High',
        'actual_recidivism': person.get('two_year_recid') == '1',
        'charge_degree': 'Felony' if person.get('c_charge_degree') == 'F' else 'Misdemeanor'
    })

import os
os.makedirs('public/data', exist_ok=True)
with open('public/data/hero_nodes.json', 'w') as f:
    json.dump(nodes, f, indent=2)

print(f'Generated {len(nodes)} nodes')
