
export default class AudioManager {
    constructor(scene) {
        this.scene = scene;
        this.sounds = new Map();
        this.music = null;
    }

    preload() {
        // Carregar arquivos de áudio
        this.scene.load.audio('build', 'game/assets/audio/build.mp3');
        this.scene.load.audio('select', 'game/assets/audio/select.mp3');
        this.scene.load.audio('background', 'game/assets/audio/background.mp3');
    }

    create() {
        // Configurar sons
        this.sounds.set('build', this.scene.sound.add('build'));
        this.sounds.set('select', this.scene.sound.add('select'));
        this.music = this.scene.sound.add('background', { loop: true });
    }

    playSound(key) {
        if (this.sounds.has(key)) {
            this.sounds.get(key).play();
        }
    }

    playMusic() {
        if (this.music && !this.music.isPlaying) {
            this.music.play();
        }
    }

    stopMusic() {
        if (this.music && this.music.isPlaying) {
            this.music.stop();
        }
    }

    setVolume(volume) {
        this.sounds.forEach(sound => sound.setVolume(volume));
        if (this.music) {
            this.music.setVolume(volume);
        }
    }
}
