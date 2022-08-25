from json import dumps, loads

TEMPS_FILE = 'temp.json'
def updateProgress(message:str):
    with open(TEMPS_FILE, 'r') as file:
        data = loads(file.read())
        data['current_progress'] = message
        with open(TEMPS_FILE, 'w') as write_stream:
            write_stream.write(dumps(data))