const electron = require('electron');
const path = require('path');
const {
    app,
    Tray,
    clipboard,
    Menu,
    globalShortcut
} = electron;



const imageName = 'clipboard_icon.png'
const TRAY_ICON_RELATIVEPATH = `/resources/images/${imageName}`;
const TRAY_ICON_PATH = path.join(__dirname, TRAY_ICON_RELATIVEPATH);
const POLL_INTERVAL = 1000;
const STACK_SIZE = 1000;
const MAX_LEN = 10;




let tray = null;

function checkClipboardForChange(clipboard, onChange) {
    let cache = clipboard.readText();
    let latest;
    setInterval(_ => {
        latest = clipboard.readText();
        if (latest !== cache) {
            cache = latest;
            //Call the function 
            onChange(cache);
        }
    }, POLL_INTERVAL);
}

function addToStack(item, stack) {
    return [item].concat(stack.length >= STACK_SIZE ? stack.slice(0, stack.length - 1) : stack);
}

function formatMenuItemForStack(item) {
    return `Copy : ${item.length>MAX_LEN?(item.substring(0,MAX_LEN-1)+'...'): item}`
}

function formatMenuTemplateForStack(clipboard, stack) {
    return stack.map((item, i) => {
        return {
            label: formatMenuItemForStack(item),
            click: _ => {
                clipboard.writeText(`${stack[i]}`)
            },
            accelerator: `CmdOrCtrl+${i+1}`
        }
    })
}

function registerShortcuts(globalShortcut,clipboard,stack){
	globalShortcut.unregisterAll();
	for(let i=0;i<STACK_SIZE;i++){
		globalShortcut.register(`CmdOrCtrl+${i+1}`,_=>{
			clipboard.writeText(stack[i]);
		})
	}
}

app.on('ready', _ => {
    console.log('Initializing the tray');
    let stack = [];
    tray = new Tray(TRAY_ICON_PATH);
    tray.setContextMenu(Menu.buildFromTemplate([{
        label: '<Empty>',
        enabled: false
    }]));
    tray.setToolTip('Clipboard Demo APP!');

    checkClipboardForChange(clipboard, text => {
        stack = addToStack(text, stack);
        tray.setContextMenu(Menu.buildFromTemplate(formatMenuTemplateForStack(clipboard, stack)));
    });

});

app.on('will-quit',_=>{
	globalShortcut.unregisterAll();
});