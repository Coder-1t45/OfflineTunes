import eel as app
from json import loads, dumps

import youtube_dl
import threading
import os
import time

from temp import TEMPS_FILE

tunes_folder = 'Tunes'
DARK_MODE = False

downloading = False
gathering = False
current_progress = ''

#youtube-dl
download_list = []

#get progress within the youtube_dl.downloader.common.py _report_progress_status() function
def download(tune_name:str, tune_link:str, id:int):
    global download_list, gathering, downloading

    gathering = True
    #updating tune status to downloading
    statusTune(id=id)
    video_url = tune_link
    video_info = youtube_dl.YoutubeDL().extract_info(
        url = video_url,download=False
    )
    
    filename = video_info['title'] if tune_name == '' else tune_name + '.mp3' if not tune_name.endswith('.mp3') else tune_name  #f"{video_info['title']}.mp3"
    options={
        'format':'bestaudio/best',
        'keepvideo':False,
        'outtmpl':f'{tunes_folder}/{filename}',
    }

    downloading = True
    with youtube_dl.YoutubeDL(options) as ydl:
        ydl.download([video_info['webpage_url']])
    downloading = False
    #updating tune status to local
    updateTune(id=id, src=f'{tunes_folder}/{filename}')
    download_list.pop(0)
    gathering = False

#get online audio for tune
def get_online_audio(tune_link):
    video_url = tune_link
    video_info = youtube_dl.YoutubeDL().extract_info(
        url = video_url,download=False
    )
    return video_info['requested_formats'][1]['url']

#threads
def gather_current_progress():
    def extarct_progress(message:str):
        if 'at' not in message: return 100, '0KiB/s', '00:00'
        precent = [m.replace('%', '') for m in message.split() if m.endswith('%')][0]
        net_speed = [m for m in message.split() if m.endswith('/s')][0]
        eta = message.split()[len(message.split()) - 1]
        return float(precent), net_speed, eta
    def extract_perfix(ns:str):
        def isfloat(element):
            try:
                float(element)
            except ValueError:
                return False
            return True
        number = ''
        temp = ns[0]
        i = 1
        while isfloat(temp) or temp.endswith('.'):
            number = temp
            i += 1
            temp = ns[0:i]
        number=number.replace(' ', '')
        return float(number), ns[i-1:]

    while True:
        global TEMPS_FILE
        if downloading:
            global current_progress

            from temp import progress_message as PROGRESS
            current_progress = PROGRESS

            p, ns, eta = extarct_progress(PROGRESS)         
            net_speed, net_perfix = extract_perfix(ns)
            
            app.currentProgress(p, net_speed, net_perfix, eta)
        time.sleep(1/3) #sleep for 1 frames thread

def download_thread_management():
    id = 1
    while True:
        global download_list
        if len(download_list) > 0 and not gathering:
            object = download_list[0]
            download(object['name'], object['link'], object['id'])

gather_thread = threading.Thread(target=gather_current_progress)
gather_thread.start()
thread = threading.Thread(target=download_thread_management)
thread.start()

#handeling client

@app.expose
def load_data():
    #data loading
    with open(TEMPS_FILE, 'r') as read_stream:
        global DARK_MODE
        data = loads(read_stream.read())
        return [dumps(data['tunes_data']), DARK_MODE, tunes_folder]

@app.expose
def addTunes(name, link):
    #adding tune to the data and download list
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
    
        return [True, object['online_src'], object['id']] #list unpacking

@app.expose
def delteTunes(ids:list):
    #deleting function
    try:
        with open(TEMPS_FILE, 'r') as read_stream:
            data = loads(read_stream.read())
            clear_unwanted = False

            for id in ids:
                tune = data['tunes_data'][id]
                if (tune['status'] == 'local'):
                    os.remove(tune['src'])
                elif (tune['status'] == 'downloading'):
                    clear_unwanted = True
                #elif (tune['status'] == 'online'): do nothing
            
            #remove from the list afterwords for not damaging the process
            for id in sorted(ids, reverse=True):
                del data['tunes_data'][id]
            
            #clear unwated .part's files
            if clear_unwanted:
                data_files = [tune['src'] for tune in data['tunes_data']]
                folder_files = [f for f in os.listdir(tunes_folder) if os.path.isfile(os.path.join(tunes_folder, f))]
                for f in folder_files:
                    if f not in data_files:
                        fpath = os.path.join(tunes_folder, f)
                        os.remove(fpath)

            with open(TEMPS_FILE, 'w') as write_stream:
                write_stream.write(dumps(data))

                return 'Done'
    except:
        return 'Failed'


#update that the app start downloading
def statusTune(id):
    with open(TEMPS_FILE, 'r') as read_stream:
        data = loads(read_stream.read())

        data['tunes_data'][id]['status'] = 'downloading'
        
        with open(TEMPS_FILE, 'w') as write_stream:
            write_stream.write(dumps(data))
            try:
                app.statusTune(id)
            except:
                pass
            
#update after download
def updateTune(id, src):
    #change status and src
    with open(TEMPS_FILE, 'r') as read_stream:
        data = loads(read_stream.read())

        data['tunes_data'][id]['status'] = 'local'
        data['tunes_data'][id]['src'] = src
        
        with open(TEMPS_FILE, 'w') as write_stream:
            write_stream.write(dumps(data))
            app.updateTune(id, src)


temp_sample = {
    'tunes_data':[
        #{'name':'', 'src':'', 'status':''}
    ],
    'tunes_location':tunes_folder,
    'dark_mode':False,
}

#check if theres uncomplited downlod files:
def check_past_downloading():
     with open(TEMPS_FILE, 'r') as read_stream:
        data = loads(read_stream.read())
        tunes_data = data['tunes_data']

        #usage
        clear_unwanted = False
        global download_list
        
        for id, tune in enumerate(tunes_data):
            if tune['status'] != 'local':
                tune = tune|{'id':id}
                download_list.append(tune)
                if tune['status'] == 'downloading':
                    clear_unwanted = True
        
        #clear unwated .part's files
        if clear_unwanted:
            data_files = [tune['src'] for tune in tunes_data]
            folder_files = [f for f in os.listdir(tunes_folder) if os.path.isfile(os.path.join(tunes_folder, f))]
            for f in folder_files:
                if f not in data_files:
                    fpath = os.path.join(tunes_folder, f)
                    os.remove(fpath)
        
        with open(TEMPS_FILE, 'w') as write_stream:
            write_stream.write(dumps(data))

#apply requests from outsider path / local file problem
@app.btl.route('/tune/<music>')
def local_file_addressor(music:str):
    tunes_data = []
    with open(TEMPS_FILE, 'r') as read_stream:
        data = loads(read_stream.read())
        tunes_data = data['tunes_data']
    for tune in tunes_data:
        if tune['name'] == music:
            folder = '/'.join(tune['src'].replace('\\','/').split('/')[:-1])
            return app.btl.static_file(music + '.mp3' if not music.endswith('.mp3') else music,folder)

def sload_data():
    with open(TEMPS_FILE, 'r') as read_stream:
        data = loads(read_stream.read())
        global DARK_MODE, tunes_folder
        DARK_MODE = data['dark_mode']
        tunes_folder = data['tunes_location']

@app.expose
def closeSocket(dark_mode):
    #save dark_mode and temp_folder
    with open(TEMPS_FILE, 'r') as read_stream:
        data = loads(read_stream.read())

        data['dark_mode'] = dark_mode
        data['tunes_location'] =  tunes_folder

        with open(TEMPS_FILE, 'w') as write_stream:
            write_stream.write(dumps(data))
    #exit programm
    os._exit(0)

@app.expose
def changeLocation(value):
    global tunes_folder
    tunes_folder = value

@app.expose
def move_tunes():
    with open(TEMPS_FILE, 'r') as read_stream:
        data = loads(read_stream.read())

        global tunes_folder
        for tune in data['tunes_data']:
            tune_mp3 = tune['src'].replace('\\','/').split('/')[-1]
            tune_old = tune['src']
            tune_new = os.path.join(tunes_folder, tune_mp3)

            try:
                os.rename(tune_old, tune_new)
                
            except:
                import shutil
                
                shutil.move(os.path.abspath(tune_old),os.path.abspath(tune_new))
                #difrrent disk
            tune['src'] = tune_new

        with open(TEMPS_FILE, 'w') as write_stream:
            write_stream.write(dumps(data))

if __name__ == '__main__':
    #create temp if not exist
    if not os.path.exists(TEMPS_FILE):
        with open(TEMPS_FILE, 'w') as f:
            f.write(dumps(temp_sample))
    
    sload_data()
    check_past_downloading()
    
    #run the app
    app.init('views')
    app.start('index.html',size=(1330, 720))

# python -m eel main.py views --onefile --noconsole
# https://github.com/ChrisKnott/Eel/issues/393