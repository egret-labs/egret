export async function createEgretEnverionment(mainClz: any) {
    const div = document.createElement('div');
    div.className = 'egret-player';
    div.setAttribute('data-entry-class', 'Main');
    if (document.body.firstChild) {
        document.body.removeChild(document.body.firstChild);
    }
    document.body.appendChild(div);
    global.Main = mainClz;
    global.egret.runEgret({ renderMode: 'canvas' });
    const canvas = document.querySelector('canvas');
    const context = canvas.getContext('2d');
    await sleepFrame();
    return context;
}

function sleepFrame() {
    return new Promise((resolve, reject) => {
        requestAnimationFrame(resolve);
    });
}
