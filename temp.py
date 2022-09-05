from json import dumps, loads

TEMPS_FILE = 'temp.json'
progress_message = ''
def updateProgress(message:str):
    global progress_message
    progress_message = message
    #print(f'\n\n\n current message {progress_message} \n\n\n\n')