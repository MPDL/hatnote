import {Howl} from "howler";
import {sound_map} from "./audio_files";
import {SettingsData} from "../configuration/hatnote_settings";
import {Subject} from "rxjs";
import {ServiceEvent} from "../service_event/model";

export class HatnoteAudio {
    private readonly sound_totals: number = 51
    private current_notes: number = 0
    private readonly celesta: Howl[] = []
    private readonly clav: Howl[] = []
    private readonly swells: Howl[] = []
    private readonly harp: Howl[] = []
    private lastAudioPlayed: number = 0
    private readonly settings_data: SettingsData

    constructor(settings_data: SettingsData ) {
        this.settings_data = settings_data

        let loaded_sounds = 0

        let thisAudio = this
        let sound_load = function() {
            loaded_sounds += 1
            if (loaded_sounds == thisAudio.sound_totals) {
                console.log('Loading complete')
            }
        }
        // load celesta and clav sounds
        let fn: string;
        let i;
        for (i = 1; i <= 24; i++) {
            if (i > 9) {
                fn = 'c0' + i;
            } else {
                fn = 'c00' + i;
            }
            this.celesta.push(new Howl({
                src: [sound_map.get('sounds/celesta/' + fn + '.ogg'),
                    sound_map.get('sounds/celesta/' + fn + '.mp3')],
                volume: 0.2,
                onend: function() {
                    thisAudio.current_notes--;
                    if(thisAudio.settings_data.debug_mode){
                        console.log("Number of audio playing (subtract): " + thisAudio.current_notes)
                    }
                },
                onload: sound_load
            }))

            this.clav.push(new Howl({
                src: [sound_map.get('sounds/clav/' + fn + '.ogg'),
                    sound_map.get('sounds/clav/' + fn + '.mp3')],
                volume: 0.2,
                onend: function() {
                    thisAudio.current_notes--;
                    if(thisAudio.settings_data.debug_mode){
                        console.log("Number of audio playing (subtract): " + thisAudio.current_notes)
                    }
                },
                onload: sound_load
            }))
        }

        // load swell sounds
        for (i = 1; i <= 3; i++) {
            this.swells.push(new Howl({
                src : [sound_map.get('sounds/swells/swell' + i + '.ogg'),
                    sound_map.get('sounds/swells/swell' + i + '.mp3')],
                volume : 0.2,
                onend: function() {
                    thisAudio.current_notes--;
                    if(thisAudio.settings_data.debug_mode){
                        console.log("Number of audio playing (subtract): " + thisAudio.current_notes)
                    }
                },
                onload : sound_load
            }))
        }

        // load transition sound
        this.harp.push(new Howl({
            src : [sound_map.get('sounds/ConcertHarp-small/samples/C3_mf3.wav')],
            volume : 0.2,
            onload : sound_load
        }))
       this.harp.push(new Howl({
            src : [sound_map.get('sounds/ConcertHarp-small/samples/F2_f1.wav')],
            volume : 0.2,
            onload : sound_load
        }))
        this.harp.push(new Howl({
            src : [sound_map.get('sounds/ConcertHarp-small/samples/A2_mf1.wav')],
            volume : 0.2,
            onload : sound_load,
        }))
    }

    public play_sound(size: number, serviceEvent: ServiceEvent) {
        if(this.settings_data.audio_mute) {
            return;
        }

        // prevent audio playing at the same time
        if(Date.now() - this.lastAudioPlayed < this.settings_data.audioProtection){
            return;
        }

        let max_pitch = 100.0;
        let log_used = 1.0715307808111486871978099;
        let pitch = 100 - Math.min(max_pitch, Math.log(size + log_used) / Math.log(log_used));
        let index = Math.floor(pitch / 100.0 * Object.keys(this.celesta).length);
        let fuzz = Math.floor(Math.random() * 4) - 2;
        index += fuzz;
        index = Math.min(Object.keys(this.celesta).length - 1, index);
        index = Math.max(1, index);
        if (this.current_notes < this.settings_data.sound_overlap) {
            this.current_notes++;
            if(this.settings_data.debug_mode){
                console.log("Number of audio playing (add): " + this.current_notes)
            }

            switch (serviceEvent){
                case ServiceEvent.keeper_file_create:
                case ServiceEvent.bloxberg_block:
                case ServiceEvent.keeper_new_library:
                case ServiceEvent.minerva_public_message:
                    this.celesta[index].play();
                    break;
                case ServiceEvent.keeper_file_edit:
                case ServiceEvent.bloxberg_confirmed_transaction:
                case ServiceEvent.minerva_direct_message:
                case ServiceEvent.minerva_group_message:
                    this.clav[index].play();
                    break;
                case ServiceEvent.keeper_new_user:
                case ServiceEvent.bloxberg_licensed_contributor:
                case ServiceEvent.minerva_private_message:
                    this.play_random_swell();
                    break;
            }
            this.lastAudioPlayed = Date.now();
        }
    }

    public async play_transition_sound(){
        if(!this.settings_data.audio_mute) {
            this.harp[1].play();
            await new Promise(resolve => setTimeout(resolve, 250));
            this.harp[0].play();
            await new Promise(resolve => setTimeout(resolve, 250));
            this.harp[2].play();
        }
    }

    private play_random_swell() {
        if(this.settings_data.audio_mute) {
            return;
        }
        let index = Math.round(Math.random() * (this.swells.length - 1));
        this.swells[index].play();
    }
}