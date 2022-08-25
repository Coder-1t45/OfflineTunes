from main import TEMPS_FILE
from json import dumps, loads

def updateProgress(message:str):
    with open(TEMPS_FILE, 'r') as file:
        data = loads(file.read())
        data['current_progress'] = message
        with open(TEMPS_FILE, 'w') as write_stream:
            write_stream.write(dumps(data))