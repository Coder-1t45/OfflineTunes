
let audio_element = document.getElementById('audio_player')
let name_text = document.getElementById('audio_name');

let repeate_mode = false;
let progressUpdateable = true;
let current_index = 0; //current tune index
let status = ['online', 'downloading', 'local']

let tunes_data = []
/* every_object_in_tunes_data =  { name:'', src:'', status:'', maybe_element:''}*/

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

async function addTunes(name, link){
    let value = await eel.addTunes(name, link)();

    if (value){

    }
    else{
        
    }
}

function playTune(index){
    tunes_data.forEach((element, id)=>{
        if (id == index){
            name_text.innerHTML = 'playιng: ' + tunes_data[index].name;
            audio_element.src = tunes_data[index].src;
            document.getElementById('elements_table').children[id].style = 'background-color: rgb(205, 205, 205);';
        }
        else{
            document.getElementById('elements_table').children[id].style = '';
        }
    })

    audio_element.currentTime = 0;
}
function updateTime(){
    document.getElementById("time").innerHTML = strToTime((progress_element.value / 10000) * audio_element.duration) + ' / ' + strToTime(audio_element.duration);
}

function clear(){
    let parent = document.getElementById('elements_table')
    while (parent.firstChild) {
        parent.removeChild(parent.firstChild);
    }
    return parent
}
async function load_data(){
    //clear parent
    parent = clear();

    //get data
    tunes_data = JSON.parse(await eel.load_data()());

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
function play_button(button){
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

function repeat_button(button){
    colorp = 'rgb(48, 118, 240)'
    if (button.style['color'] == colorp) 
    {button.style = 'color:white;';repeate_mode=false;}
    else {button.style = 'color:'+colorp+';';repeate_mode=true;}
}

function move_audio(multi){
    let addon = 5 * multi
    audio_element.currentTime += addon
}

function index_button(multi){
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
function adding_volume(x, m = 0.05){
    audio_element.volume += x * m 
    if (audio_element.volume > 1)
        audio_element.volume = 1
    else if (audio_element.volume < 0)
        audio_element.volume = 0
}
function volume_input(input_range){
    audio_element.volume = (input_range.value / input_range.max) * 1
}
//when window ready
$(window).ready(()=>{
    //start space
    audio_element = document.getElementById('audio_player')
    name_text = document.getElementById('audio_name');
    progress_element = document.getElementById('progress')

    audio_element.addEventListener('timeupdate',Update, false);
   
    load_data();


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
          
    
    //disable mouse-page scaling
    $(document).keydown(function(event) {
    if (event.ctrlKey==true && (event.which == '61' || event.which == '107' || event.which == '173' || event.which == '109'  || event.which == '187'  || event.which == '189'  ) ) {
            event.preventDefault();
        }

        
        if (event.which == '32') {
            play_button(document.getElementById('playButton'))
        }
        if (event.ctrlKey == true && event.which == '39'){
            index_button(1)
        }
        else if (event.which == '39'){
            move_audio(1)
        }
        if (event.ctrlKey == true && event.which == '37'){
            index_button(-1)
        }
        if (event.which == '37'){
            move_audio(-1)
        }
        if (event.which == '38'){
            adding_volume(1)
        }
        if (event.which == '40'){
            adding_volume(-1)
        }
        // 107 Num Key  +
        // 109 Num Key  -
        // 173 Min Key  hyphen/underscor Hey
        // 61 Plus key  +/= key
    });

    function disableWheeling (event) {
        if (event.type == "wheel" && event.ctrlKey == true) {
            e.preventDefault();
        }
    }
    
    $(window).bind('wheel', (e) => {if (event.ctrlKey == true) e.preventDefault();});

})