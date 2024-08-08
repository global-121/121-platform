# TODO: remove this file I used it to automate the creation of FSP configuration
# This script reads JSON files from a directory, transforms the data, and writes the transformed data to a new JSON file.
import os
import json

dir_path = 'fsp'  # replace with your directory path
final_data = []

# Loop over each file
for file in os.listdir(dir_path):
    # Get the full path of the file
    file_path = os.path.join(dir_path, file)

    # Open the file
    with open(file_path, 'r', encoding='utf-8') as f:
        # Load the JSON data from the file
        data = json.load(f)

    # convert fspquestion to attributes
    attributes = []
    for question in data['questions']:
        attribute = {
            'name': question['name'],
            'required': True,
        }
        attributes.append(attribute)

    # Transform the data
    transformed_data = {
        'name': data['fsp'],
        'integrationType': data['integrationType'],
        'hasReconciliation': False,
        'deliveryMechanisms': [
            {
                'name': data['fsp'],
                'type': 'mobileMoney',
                'defaultLabel': data['displayName'],
                'notifyOnTransaction': data.get('notifyOnTransaction', False),
                'attributes': attributes
            }
        ]
    }

    # Append the transformed data to the final list
    final_data.append(transformed_data)

# Write the final data to a new JSON file
with open('final_data.json', 'w', encoding='utf-8') as f:
    json.dump(final_data, f, ensure_ascii=False, indent=2)
