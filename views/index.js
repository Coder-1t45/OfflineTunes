
let audio_element = document.getElementById('audio_player');
let progress_element = document.getElementById('progress');
let play_button_element = document.getElementById('playButton');
let name_text = document.getElementById('audio_name');
let volume_input_element = document.getElementById('volume_range')

let repeate_mode = false;
let progressUpdateable = true;
let current_index = -1; //current tune index
let status = ['online', 'downloading', 'local']

let trash_mode = false;
let trash_selected_ids = []

let tunes_data = []
let downloading_list = []

let current_progress = 0;
let keyboard_occupied = false;

let dark_mode = false;
let tunes_folder = '';
/* every_object_in_tunes_data =  { name:'', src:'', status:'', maybe_element:''}*/

//helpful functions
function strToTime(val) {
    function tos(a){
        return a.toLocaleString('en-US', {minimumIntegerDigits: 2,useGrouping: false})
    }
    let seconds =  Math.floor(val % 60)
    let minutes = Math.floor(val / 60 % 60)
    let hours = Math.floor(val / 3600 % 24)

    if (hours > 0) return tos(hours) + ':' + tos(minutes) + ':' + tos(seconds)
    else return tos(minutes) + ':' + tos(seconds)
}

function list_filter(f, l){
    let nd = [];
    l.forEach(x => {
        if (f(x))
            nd.push(x)
    });
    return nd;
}

//done

async function addTunes(name, link, buttonPlay, buttonCancel) {
    let b = false; let online_src = ''; let id = -1;

    buttonPlay.disabled = true;
    buttonCancel.disabled = true;

    [b, online_src, id] = await eel.addTunes(name, link)();

    buttonPlay.disabled = false;
    buttonCancel.disabled = false;

    let parent = document.getElementById('elements_table')
    let status = 'online';

    
    if (b) {
        allProgressRELOAD()
        
        tunes_data.push({name:name, src:'', link:link, online_src:online_src, status:status})

        let clone = document.getElementById('duplicate').cloneNode(true);
        clone.style ='';
        
        clone.id = 'tune_temp[' + id + ']';

        clone.children[0].innerHTML = name
        clone.children[1].innerHTML = status != 'local' ? status : '';

        clone.onclick = () => {playTune(id);}
        parent.append(clone)

        document.getElementById('add_screen').style='display:none;'
    }
    else {

    }
}

//eel functions
eel.expose(statusTune);
function statusTune(id) {
    tunes_data[id].status = 'downloading';
    let parent = document.getElementById('elements_table')
    parent.children[id].children[1].innerHTML = 'downloading';
}

eel.expose(updateTune);
function updateTune(id, src) {
    tunes_data[id].status = 'local';
    tunes_data[id].src = src;
    let parent = document.getElementById('elements_table')
    parent.children[id].children[1].innerHTML = '';

    allProgressNEXT()
}

//done

function playTune(index) {
    if (trash_mode){
        let id = trash_selected_ids.indexOf(index);
        if (id !== -1) {
            trash_selected_ids.splice(id, 1);
            document.getElementById('elements_table').children[id].style = '';
        }
        else {
            document.getElementById('elements_table').children[index].style = 'background-color: var(--tunebox-trash);';
            trash_selected_ids.push(index);
        }
    }
    else{
        current_index = index;
        tunes_data.forEach((element, id)=>{
            if (id == current_index){
                name_text.innerHTML = 'playιng: ' + element.name;
                audio_element.src =  element.status != 'local'? element.online_src: '/tune/'+element.name;
                document.getElementById('elements_table').children[id].style = 'background-color: var(--tunebox-selected); color:white;';
            }
            else{
                document.getElementById('elements_table').children[id].style = '';
            }
        })
        
        progress_element.value = 0;
        audio_element.currentTime = 0;
        audio_element.play()
        play_button_element.innerHTML = 'II';
        if (play_button_element.className == '') play_button_element.className = 'd'
    }
}
function updateTime() {
    document.getElementById("time").innerHTML = strToTime((progress_element.value / 10000) * audio_element.duration) + ' / ' + strToTime(audio_element.duration);
}

function clear() {
    let parent = document.getElementById('elements_table')
    while (parent.firstChild) {
        parent.removeChild(parent.firstChild);
    }
    return parent
}

async function move_tunes(){
    await eel.move_tunes()()
}

async function changingLocation(value){
    tunes_folder = value;
    document.getElementById('location_sumbit').disabled = true;
    await eel.changeLocation(value)()
}

async function load_data() {
    //clear parent
    parent = clear();

    //get data
    [json_tuned_data, dark_mode, tunes_folder] = await eel.load_data()()

    document.getElementById('location_input').value = tunes_folder
    document.getElementById('location_input').onchange = () => {
        document.getElementById('location_sumbit').disabled = document.getElementById('location_input').value == tunes_folder;
    }
    document.getElementById('location_sumbit').onclick = () =>{
        changingLocation(document.getElementById('location_input').value)
    }

    tunes_data = JSON.parse(json_tuned_data);
    dark_mode_handle()

    tunes_data.forEach((element, id) => {
        let name = element.name;
        let status = element.status;

        let clone = document.getElementById('duplicate').cloneNode(true);
        clone.style ='';
        
        clone.id = 'tune_temp[' + id + ']';

        clone.children[0].innerHTML = name
        clone.children[1].innerHTML = status != 'local' ? status : '';

        clone.onclick = () => {playTune(id);}
        parent.append(clone)
    });
}

//player buttons
function play_button(button) {
    let a = new Audio()
    a.className
    //currentTime - זמן כרגע
    //duration - כל זמן הסאונד
    if (button.innerHTML == '▷' && audio_element.src && audio_element.src != '' &&  audio_element.src != location.href){
        button.innerHTML = 'II';
        if (button.className == '') button.className = 'd'
        //start situation
        audio_element.play()
    }
    else{
        if (button.className == 'd') button.className = ''
        button.innerHTML = '▷';
        //pause situation
        audio_element.pause()
    }
}

function repeat_button(button) {
    colorp = 'rgb(48, 118, 240)';
    if (button.style['color'] == colorp) 
    {button.style = 'color:white;';repeate_mode=false;}
    else {button.style = 'color:'+colorp+';';repeate_mode=true;}
}

function move_audio(multi) {
    let addon = 5 * multi;
    audio_element.currentTime += addon;
}

function index_button(multi) {
    //return;
    //disabled right now
    
    if (tunes_data.length > 0) {
        current_index = (current_index + multi) % tunes_data.length;
        playTune(current_index);
    }
    else {
        current_index = -1;
        audio_element.src = "";
    }
}

function adding_volume(x, m = 0.05) {
    audio_element.volume += x * m ;
    if (audio_element.volume > 1)
        audio_element.volume = 1;
    else if (audio_element.volume < 0)
        audio_element.volume = 0;
    volume_input_element.value = audio_element.volume * volume_input_element.max;
}

function volume_input(input_range) {
    audio_element.volume = (input_range.value / input_range.max) * 1;
}

//trash functionality
async function trashButton(trash_button){
    trash_mode = !trash_mode;
    trash_button.innerHTML = trash_mode ? '?' : 'X';
    
    if (!trash_mode){
        trash_button.style='';
        
        tunes_data.forEach((element, id)=>{
            if (id == current_index) {
                document.getElementById('elements_table').children[id].style = 'background-color: rgb(205, 205, 205);';
                
            }
            else {
                document.getElementById('elements_table').children[id].style = '';
            }
        })

        //send to client
        result = await eel.delteTunes(trash_selected_ids)();
        if (result == 'Done') {
            if (current_index in trash_selected_ids) {
                if (tunes_data.length == 0) {
                    audio_element.pause();

                    audio_element.currentTime = 0;
                    audio_element.src = '';

                    current_index = -1;
                    name_text.innerHTML = 'not playιng';
                }
                else index_button(1);
            }
            parent = document.getElementById('elements_table');
            trash_selected_ids.sort(function(a, b){return b - a});
            trash_selected_ids.forEach((element) => {
                parent.removeChild(parent.children[element]);
                tunes_data = tunes_data.slice(element,1);
            })
        }
        else if (result == 'Failed') alert(result);
        trash_selected_ids = []; //delete the list
    }
    else{
        trash_button.style='color:white; background-color:#3d3d3d;';
        if (current_index >= 0) document.getElementById('elements_table').children[current_index].style = '';

    }
}
function trashOver(trash_button){
    if (trash_mode){
        trash_button.innerHTML = trash_selected_ids.length == 0? 'X' : 'V';
    };
}

function trashLeave(trash_button){
    if (trash_mode){
        trash_button.innerHTML = '?';
    };
    if (!trash_mode){
        trash_button.innerHTML = 'X';
    };
}
//all progress
let ap_maxtunes = 0;
let ap_index = 0;
let ap_current = 0;

function allProgressRELOAD(){
    ap_maxtunes = list_filter((o)=>{return o.status == 'downloading' || o.status == 'online'},tunes_data).length;
}
function allProgressUPDATE(){
    allProgressRELOAD();
    ap_current = current_progress;
    //display
    let value = (ap_current / 100 + ap_index) / ap_maxtunes
    all_progress = document.getElementById('m_allProgress');
    try{
        all_progress.value = value * all_progress.max;
    }
    catch{
        
    }
    
}
function allProgressNEXT(){
    ap_current = 0;
    ap_index+=1
}

eel.expose(currentProgress);
function currentProgress(p, net_speed, perfix, eta) {
    
    console.log([p, net_speed, perfix, eta]);
    window.frames[0].frameElement.contentWindow.Append(p, net_speed, perfix, eta);     
    document.getElementById('m_currentProgress').value = p;
    current_progress = p;
}

function trigger_dark_mode(){
    dark_mode = !dark_mode;
    dark_mode_handle();
}
function dark_mode_handle(){
    document.body.className = dark_mode ? 'dark': '';
    object = document.getElementById('dark_mode')
    object.checked = dark_mode;
}

function check_occupied(){
    let el = document.activeElement;

    if (el && (el.tagName.toLowerCase() == 'input' && el.type == 'text' ||
        el.tagName.toLowerCase() == 'textarea')) {
        keyboard_occupied = true;
    } 
    else {
        keyboard_occupied = false;
    }
}

//when window ready
$(window).ready(()=>{
    //start space
    trash_mode = false;

    audio_element = document.getElementById('audio_player')
    name_text = document.getElementById('audio_name');
    progress_element = document.getElementById('progress')
    play_button_element = document.getElementById('playButton')

    audio_element.addEventListener('timeupdate',Update, false);
    volume_input_element = document.getElementById('volume_range')

    load_data();


    //load interval
    let interval = window.setInterval(allProgressUPDATE, 1000 / 2)

    function Update(){
        
        if (progressUpdateable)
            progress_element.value = audio_element.currentTime / audio_element.duration * progress_element.max
        if (audio_element.currentTime / audio_element.duration == 1){
            if (repeate_mode) {audio_element.currentTime = 0; audio_element.play()}
            else{
                play_button_element = document.getElementById('playButton')
                play_button_element.innerHTML = '▷';
                if ($(play_button_element).hasClass('d'))$(play_button_element).addClass('d')
            }
        }
        updateTime()
    }

    progress_element.onclick = function () {
        audio_element.currentTime = (progress_element.value / progress_element.max) * audio_element.duration;
    }
    
    progress_element.onchange = function (){
        updateTime();
    }
    progress.oninput = function (){
        updateTime();
    } 
    
    //input keyboard occupied
    let another_interval = setInterval(check_occupied, 100)

    //disable mouse-page scaling
    //https://keyjs.dev/
    $(document).keydown(function(event) {
    if (event.ctrlKey==true && (event.which == '61' || event.which == '107' || event.which == '173' || event.which == '109'  || event.which == '187'  || event.which == '189'  ) ) {
            event.preventDefault();
        }
        if (!keyboard_occupied) {
            
            if (event.which == '32') {
                play_button(document.getElementById('playButton'))
            }
            if (event.ctrlKey == true && event.which == '39'){
                event.preventDefault();
                index_button(1)
            }
            else if (event.which == '39'){
                event.preventDefault();
                move_audio(1)
            }
            if (event.ctrlKey == true && event.which == '37'){
                event.preventDefault();
                index_button(-1)
            }
            if (event.which == '37'){
                event.preventDefault();
                move_audio(-1)
            }
            if (event.which == '38'){
                event.preventDefault();
                adding_volume(1)
            }
            if (event.which == '40'){
                event.preventDefault();
                adding_volume(-1)
            }
            if (event.which == '116'){
                event.preventDefault();
            }
        }
        if (event.ctrlKey && ( event.which == '189'|| event.which == '107' || event.which == '187' || event.which == '109'))
        {
            event.preventDefault();
        }
        // 107 Num Key  +
        // 109 Num Key  -
        // 173 Min Key  hyphen/underscor Hey
        // 61 Plus key  +/= key
    });

    /* CANT PREVENT PASSIVE EVENT
    function disableWheeling (event) {
        if (event.type == "wheel" && event.ctrlKey == true) {
            event.preventDefault();
        }
    }
    
    $(window).bind('wheel', (e) => {
        console.log('wheel');
        disableWheeling(e);
        if (e.ctrlKey == true) 
            e.preventDefault();
    });*/

    window.onbeforeunload = window.onclose =async (eve)=>{
        eve.stopImmediatePropagation();
        eve.preventDefault();
        await eel.closeSocket(dark_mode)()
        document.close()
    }
})