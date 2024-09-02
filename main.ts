import { Plugin, Editor, App, PluginSettingTab, Setting, HeadingCache } from 'obsidian';

interface MyPluginSettings {
  nextHeadingHotkey: string;
  prevHeadingHotkey: string;
}

const DEFAULT_SETTINGS: MyPluginSettings = {
  nextHeadingHotkey: 'Mod+Alt+ArrowDown',
  prevHeadingHotkey: 'Mod+Alt+ArrowUp',
};

export default class MyPlugin extends Plugin {
  settings: MyPluginSettings; // Declare the settings property

  async onload() {
    await this.loadSettings(); // Load settings when the plugin loads

    this.addCommand({
      id: 'go-to-next-heading',
      name: 'Go to Next Heading',
      hotkeys: [
        {
          modifiers: ['Mod', 'Alt'], // Example: Ctrl+Alt (or Cmd+Alt on Mac)
          key: 'ArrowDown'
        }
      ],
      editorCallback: (editor: Editor) => {
        goToHeading(this.app, editor, 'next');
      }
    });

    this.addCommand({
      id: 'go-to-prev-heading',
      name: 'Go to Previous Heading',
      hotkeys: [
        {
          modifiers: ['Mod', 'Alt'], // Example: Ctrl+Alt (or Cmd+Alt on Mac)
          key: 'ArrowUp'
        }
      ],
      editorCallback: (editor: Editor) => {
        goToHeading(this.app, editor, 'prev');
      }
    });

    this.addSettingTab(new MyPluginSettingTab(this.app, this)); // Add the settings tab
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }
}

function goToHeading(app: App, editor: Editor, boundary: 'prev' | 'next') {
  const activeFile = app.workspace.getActiveFile();
  if (!activeFile) {
    // If there's no active file, return early
    return;
  }

  const file = app.metadataCache.getFileCache(activeFile);
  if (!file?.headings || file.headings.length === 0) {
    return;
  }
  
  const { line } = editor.getCursor("from");
  let prevHeadingLine = 0;
  let nextHeadingLine = editor.lastLine();
  file.headings.forEach(({ position }: { position: HeadingCache['position'] }) => {
    const { end: headingPos } = position;
    if (line > headingPos.line && headingPos.line > prevHeadingLine) {
      prevHeadingLine = headingPos.line;
    }
    if (line < headingPos.line && headingPos.line < nextHeadingLine) {
      nextHeadingLine = headingPos.line;
    }
  });
  editor.setSelection(boundary === 'prev' ? getLineEndPos(prevHeadingLine, editor) : getLineEndPos(nextHeadingLine, editor));
}

function getLineEndPos(line: number, editor: Editor) {
  return {
    line,
    ch: editor.getLine(line).length
  };
}

class MyPluginSettingTab extends PluginSettingTab {
  plugin: MyPlugin;

  constructor(app: App, plugin: MyPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    containerEl.createEl('h2', { text: 'Heading Navigation Settings' });

    new Setting(containerEl)
      .setName('Next Heading Hotkey')
      .setDesc('Set the hotkey for jumping to the next heading')
      .addText(text => text
        .setPlaceholder('Mod+Alt+ArrowDown')
        .setValue(this.plugin.settings.nextHeadingHotkey)
        .onChange(async (value) => {
          this.plugin.settings.nextHeadingHotkey = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('Previous Heading Hotkey')
      .setDesc('Set the hotkey for jumping to the previous heading')
      .addText(text => text
        .setPlaceholder('Mod+Alt+ArrowUp')
        .setValue(this.plugin.settings.prevHeadingHotkey)
        .onChange(async (value) => {
          this.plugin.settings.prevHeadingHotkey = value;
          await this.plugin.saveSettings();
        }));
  }
}
