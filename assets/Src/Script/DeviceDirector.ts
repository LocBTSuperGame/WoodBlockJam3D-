export class DeviceDirector {
    private static _instance: DeviceDirector;

    public static get instance(): DeviceDirector {
        if (!this._instance) {
            this._instance = new DeviceDirector();
        }
        return this._instance;
    }

    private constructor() { }

    public redirectToStore(): void {
        const userAgent = navigator.userAgent || navigator.vendor;

        if (/iPad|iPhone|iPod/.test(userAgent) && !('MSStream' in window)) {
            confirm('Dowload Game to play?');
            window.location.href = 'https://play.google.com/store/apps/details?id=com.slide.block.color.jam.out&hl=en';
        } else {
            window.location.href = 'https://play.google.com/store/apps/details?id=com.slide.block.color.jam.out&hl=en'
            confirm('Dowload Game to play?')

        }
    }
}
