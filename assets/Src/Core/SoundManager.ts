import { _decorator, AudioClip, AudioSource, Component, Node, resources } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('SoundManager')
export class SoundManager extends Component {
    public static instance: SoundManager;

    private bgmSource: AudioSource = null!;
    private sfxSource: AudioSource = null!;

    @property(Node)
    public bgmNode: Node = null!;

    @property(Node)
    public sfxNode: Node = null!;

    onLoad() {
        SoundManager.instance = this;

        this.bgmSource = this.bgmNode.getComponent(AudioSource)!;
        this.sfxSource = this.sfxNode.getComponent(AudioSource)!;
    }

    playBGM(path: string) {
        resources.load(`Sound/${path}`, AudioClip, (err, clip) => {
            if (err || !clip) {
                console.warn('Không tìm thấy nhạc nền:', path);
                return;
            }
            this.bgmSource.clip = clip;
            this.bgmSource.loop = true;
            this.bgmSource.play();
        });
    }

    playSFX(path: string) {
        resources.load(`Sound/${path}`, AudioClip, (err, clip) => {
            if (err || !clip) {
                console.warn('Không tìm thấy sound effect:', path);
                return;
            }
            this.sfxSource.playOneShot(clip, 1);
        });
    }

    stopBGM() {
        this.bgmSource.stop();
    }
}
