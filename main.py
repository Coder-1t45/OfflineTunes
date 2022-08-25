import eel as app
from json import loads, dumps

import youtube_dl
import threading
import os

TUNES_FOLDER = 'views/musics'
TEMPS_FILE = 'temp.json'

downloading = False
gathering = False
current_progress = ''

#youtube-dl
download_list = []

#get progress within the youtube_dl.downloader.common.py _report_progress_status() function
def download(tune_name:str, tune_link:str, id:int):
    global download_list, gathering, downloading

    gathering = True
    video_url = tune_link
    video_info = youtube_dl.YoutubeDL().extract_info(
        url = video_url,download=False
    )
    filename = tune_name + '.mp3' if not tune_name.endswith('.mp3') else tune_name  #f"{video_info['title']}.mp3"
    options={
        'format':'bestaudio/best',
        'keepvideo':False,
        'outtmpl':f'{TUNES_FOLDER}/{filename}',
    }

    print(video_info['webpage_url'])
    downloading = True
    with youtube_dl.YoutubeDL(options) as ydl:
        ydl.download([video_info['webpage_url']])
    downloading = False
    updateTune(id=id, src=f'{TUNES_FOLDER}/{filename}')
    gathering = False

def get_online_audio(tune_link):
    video_url = tune_link
    video_info = youtube_dl.YoutubeDL().extract_info(
        url = video_url,download=False
    )
    return video_info['requested_formats'][1]['url']

#handeling client
def get_progress_data(file_path):
    while True:
        global download_list
        
        if downloading:
            global current_progress
            with open(file_path, 'r') as file:
                data = loads(file.read())
                current_progress = data['current_progress']
        
        elif len(download_list) > 0 and not gathering:
            object = download_list[0]
            dthread = threading.Thread(target=download, args=(object['name'], object['link'], object['id']))
            dthread.start()

thread = threading.Thread(target=get_progress_data, args=(TEMPS_FILE))
thread.start()

@app.expose
def load_data():
    with open(TEMPS_FILE, 'r') as read_stream:
        data = loads(read_stream.read())
        return dumps(data['tunes_data'])

@app.expose
def addTunes(name, link):
    with open(TEMPS_FILE, 'r') as read_stream:
        data = loads(read_stream.read())
        #usage
        object = {'name':name,'src':'','status':'online', 'online_src':get_online_audio(link), 'link':link}
        data['tunes_data'].append(object)
        
        object = object|{'id':len(data['tunes_data'])-1}
        global download_list
        download_list.append(object)
        
        with open(TEMPS_FILE, 'w') as write_stream:
            write_stream.write(dumps(data))
        

#update that the app start downloading
def statusTune(id):
    pass

#update after download
def updateTune(id, src):
    #change status and src
    pass

temp_sample = {
    'current_progress':'',
    'tunes_data':[
        #{'name':'', 'src':'', 'status':''}
    ]
}

if __name__ == '__main__':
    #create temp if not exist
    if not os.path.exists(TEMPS_FILE):
        with open(TEMPS_FILE, 'w') as f:
            f.write(dumps(temp_sample))
    
    #run the app
    app.init('views')
    app.start('index.html',size=(1330, 720))