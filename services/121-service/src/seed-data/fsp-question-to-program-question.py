# TODO: remove this file
import os
import json




def getFspQuestionFromFspName(fspName):
    # read all files in fsp directory
    fsp_files = os.listdir('fsp')
    for fsp_file_name in fsp_files:
      # Read file as json
      dir_name = 'fsp'
      file_path = os.path.join(dir_name, fsp_file_name)
      with open(file_path, 'r',  encoding='utf-8') as f:
        fsp_file = json.load(f)

        if fsp_file['fsp'] == fspName:
          return fsp_file['questions']



def migrateFspQuestionToProgramAttributes(program):
    # Define the new attributes
    allFspQuestions = []
    if 'financialServiceProviders' not in program:
      return program
    for fsp in program['financialServiceProviders']:
      questionsFromFsp = getFspQuestionFromFspName(fsp['fsp'])
      # Add new question to array where name is not in array
      allFspQuestionsNames = [question['name'] for question in allFspQuestions]
      for question in questionsFromFsp:
        if question['name'] not in allFspQuestions:
          allFspQuestions.append(question)

    # Add the questions to the programRegistrationAttributes of which the name does not exist
    for question in allFspQuestions:
      programRegistrationAttributesNames = [question['name'] for question in program['programRegistrationAttributes']]
      if question['name'] not in programRegistrationAttributesNames:
        program['programRegistrationAttributes'].append(question)

    fspConfigArray = []
    program ['programFinancialServiceProviderConfiguration'] = []
    for fsp in program['financialServiceProviders']:
      fspConfig = {
        "financialServiceProvider": fsp['fsp']
      }
      if 'configuration' in fsp:
        fspConfig['attributes'] = fsp['configuration']
      program ['programFinancialServiceProviderConfiguration'].append(fspConfig)



    # remove attribute financialServiceProviders from program
    del program['financialServiceProviders']
    return program


# Define the directory path
dir_path = 'program'

# Get a list of all files in the directory
files = os.listdir(dir_path)


# Loop over each file
for file in files:
    # Get the full path of the file
    file_path = os.path.join(dir_path, file)

    # if file path not contains 'ocw' skip
    # if 'ocw' not in file_path:
    #     continue


    # Open the file
    with open(file_path, 'r',  encoding='utf-8') as f:
        # Load the JSON data from the file
        program = json.load(f)
        updateProgram = migrateFspQuestionToProgramAttributes(program)

    # Write the updated data to the file
    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(updateProgram, f, ensure_ascii=False, indent=2)
        print(f"Updated {file_path}")

    #
