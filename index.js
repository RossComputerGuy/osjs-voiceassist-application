import osjs from 'osjs';
import {name as applicationName} from './metadata.json';

const Mumble = require('mumble-js');

const register = (core,args,options,metadata) => {
  const proc = core.make('osjs/application',{args,options,metadata});
	const {translatable} = core.make('osjs/locale');
	const _ = translatable(require('./locales.js'));
  if(!(window.webkitSpeechRecognition || window.SpeechRecognition)) {
    core.make('osjs/dialog','alert',{ message: _('INCOMPATIBLE') },(btn,value) => {});
    proc.destroy();
    return proc;
  }
  let started = false;
  let mumble = new Mumble({
    language: _('LANG'),
    debug: proc.args.debug,
    commands: [
      {
        name: 'launch',
        command: /^launch (.+)$/,
        action: prog => {
          core.make('osjs/packages').launch(prog).then(app => core.make('osjs/notification',{
            message: _('NOTIF_LAUNCH',prog)
          })).catch(err => core.make('osjs/dialog','alert',{ message: err.message, title: err.name },(btn,value) => {}));
        }
      },
      {
        name: 'save session',
        command: /^save session$/,
        action: () => {
          core.make('osjs/session').save();
          core.make('osjs/notification',{
            message: _('NOTIF_SAVE_SESSION',prog)
          });
        }
      },
      {
        name: 'logout',
        command: /^logout$/,
        action: () => {
          core.make('osjs/auth').logout();
        }
      }
    ],
    callbacks: {
      start: ev => {
        if(!started) {
          core.make('osjs/notification',{
            message: _('NOTIF_START')
          });
          started = true;
        }
      }
    }
  });
  mumble.start();
  const trayEntry = core.make('osjs/tray',{
    title: _('TRAY_TITLE'),
    oncontextmenu: ev => {
      ev.stopPropagation();
      ev.preventDefault();
      core.make('osjs/contextmenu',{
        position: ev.target,
        menu: [
          { label: _('TRAY_QUIT'), onclick: () => proc.destroy() },
        ]
      });
    }
  });
  proc.on('destroy',() => {
    trayEntry.destroy();
    mumble.stop();
  });
  return proc;
};
osjs.register(applicationName,register);
