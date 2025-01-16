import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting, TFile } from 'obsidian';

// Не забудьте переименовать эти классы и интерфейсы!

interface MyPluginSettings {
	mySetting: string;
}

const DEFAULT_SETTINGS: MyPluginSettings = {
	mySetting: 'manual'
}

export default class MyPlugin extends Plugin {
	settings: MyPluginSettings;

	async onload() {
		await this.loadSettings();
		this.addSettingTab(new SampleSettingTab(this.app, this));
		this.registerStyles();
		new Notice('This is a notice!');
		// Создает иконку в левой боковой панели.
		const ribbonIconEl = this.addRibbonIcon('dice', 'Sample Plugin', (evt: MouseEvent) => {
			// Вызывается при клике на иконку.
			this.findTagsInNote();
			new Notice('This is a notice!');
		});
		// Добавляет дополнительные стили к иконке.
		ribbonIconEl.addClass('my-plugin-ribbon-class');

		// Добавляет элемент в статус-бар внизу приложения. Не работает в мобильных приложениях.
		// const statusBarItemEl = this.addStatusBarItem();
		// statusBarItemEl.setText('Status Bar Text');

		// Добавляет простую команду, которую можно вызвать откуда угодно.
		this.addCommand({
			id: 'open-sample-modal-simple',
			name: 'Open sample modal (simple)',
			callback: () => {
				new SampleModal(this.app).open();
			}
		});
		// Добавляет команду для редактора, которая может выполнять операции с текущим экземпляром редактора.
		this.addCommand({
			id: 'sample-editor-command',
			name: 'Sample editor command',
			editorCallback: (editor: Editor, view: MarkdownView) => {
				console.log(editor.getSelection());
				editor.replaceSelection('Sample Editor Command');
			}
		});
		// Добавляет сложную команду, которая проверяет, позволяет ли текущее состояние приложения выполнить команду.
		this.addCommand({
			id: 'open-sample-modal-complex',
			name: 'Open sample modal (complex)',
			checkCallback: (checking: boolean) => {
				// Условия для проверки.
				const markdownView = this.app.workspace.getActiveViewOfType(MarkdownView);
				if (markdownView) {
					// Если checking равно true, мы просто проверяем, может ли команда быть выполнена.
					// Если checking равно false, мы выполняем операцию.
					if (!checking) {
						new SampleModal(this.app).open();
					}

					// Эта команда появится в палитре команд только если функция проверки возвращает true.
					return true;
				}
			}
		});

		// Добавляет вкладку настроек, чтобы пользователь мог настроить различные аспекты плагина.
		// this.addSettingTab(new SampleSettingTab(this.app, this));

		// Если плагин подключает глобальные события DOM (на частях приложения, которые не принадлежат этому плагину),
		// использование этой функции автоматически удалит обработчик события при отключении плагина.
		this.registerDomEvent(document, 'click', (evt: MouseEvent) => {
			console.log('click', evt);
		});

		// При регистрации интервалов эта функция автоматически очистит интервал при отключении плагина.
		this.registerInterval(window.setInterval(() => console.log('setInterval'), 5 * 60 * 1000));
	}

	onunload() {

	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	registerStyles() {
		const style = document.createElement('style');
		style.textContent = `
			.rule-group {
				display: flex;
				justify-content: space-between;
				align-items: center;
				border: 1px solid #ccc;
				padding: 10px;
				margin-top: 10px;
				border-radius: 5px;
			}
	
			.rule-group .setting-item {
				flex: 1;
				margin-right: 10px;
			}
	
			.rule-group .setting-item:last-child {
				margin-right: 0;
			}
	
			.rule-group .setting-item input {
				width: 100%;
			}
		`;
		document.head.appendChild(style);
	}

	/**
	 * Асинхронно находит и отображает теги в текущей активной Markdown заметке.
	 * 
	 * Этот метод получает активное представление типа `MarkdownView` из рабочей области Obsidian.
	 * Если активное представление не найдено, метод завершает выполнение.
	 * 
	 * Затем он получает содержимое активного представления и выводит его в консоль.
	 * 
	 * Метод продолжает получать файл, связанный с активным представлением. Если файл не найден, метод завершает выполнение.
	 * 
	 * Используя файл, он извлекает кэш файла из метаданных Obsidian. Он извлекает теги как из frontmatter, так и из тела заметки.
	 * Теги очищаются путем удаления ведущего символа '#'.
	 * 
	 * Наконец, метод выводит найденные теги в консоль и отображает уведомление с найденными тегами.
	 * 
	 * @returns {Promise<void>} Обещание, которое разрешается, когда теги найдены и отображены.
	 */
	async findTagsInNote(file?: TFile) {
		let activeFile = file;

		if (!activeFile) {
			const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
			if (!activeView) {
				return;
			}
			if (activeView.file) {
				activeFile = activeView.file;
			}
		}

		if (!activeFile) {
			return;
		}

		const content = await this.app.vault.read(activeFile);
		console.log('CONTENT \n', content);

		const fileCache = this.app.metadataCache.getFileCache(activeFile);
		console.log('FILECACHE', fileCache);

		const frontmatterTags = (fileCache?.frontmatter?.tags || []).map((tag) => {
			return tag.replace(/#/g, '');
		});

		const fileCacheTags = (fileCache?.tags || []).map((tag) => {
			return tag.tag.replace(/#/g, '');
		});

		let tags = [...new Set([...frontmatterTags, ...fileCacheTags])];
		console.log('TAGS', tags);
		new Notice(`Found tags: ${tags.join(', ')}`);
		return tags;
	}
}

class SampleModal extends Modal {
	constructor(app: App) {
		super(app);
	}

	onOpen() {
		const {contentEl} = this;
		contentEl.setText('Woah!');
	}

	onClose() {
		const {contentEl} = this;
		contentEl.empty();
	}
}

class SampleSettingTab extends PluginSettingTab {
	plugin: MyPlugin;

	constructor(app: App, plugin: MyPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName('Способ сканирования')
			.setDesc('Ручной - сканирование происходит при нажатии кнопки приложения.\n Автоматический - сканирование во время запуска Obsidian и после каждого сохранения заметки.')
			.addDropdown(dropdown => dropdown
				.addOption('manual', 'Ручной')
				.addOption('auto', 'Автоматический')
				.setValue(this.plugin.settings.mySetting)
				.onChange(async (value) => {
					this.plugin.settings.mySetting = value;
					await this.plugin.saveSettings();
				})
			);

		const addButton = new Setting(containerEl)
			.addButton(button => {
				button.setButtonText('Добавить правило')
					.setCta()
					.onClick(() => {
						this.addRule(containerEl);
					});
			});
	}

	addRule(containerEl: HTMLElement): void {
		const ruleContainer = containerEl.createDiv('rule-container');
		ruleContainer.addClass('rule-group');

		// Поле для ввода пути сканирования
		new Setting(ruleContainer)
			.setName('Путь сканирования')
			.addText(text => text
				.setPlaceholder('Введите путь сканирования')
				.onChange(async (value) => {
					console.log('Путь сканирования: ', value);
					// Здесь можно сохранить значение в настройки плагина
				}));

		// Поле для ввода пути перемещения файла
		new Setting(ruleContainer)
			.setName('Путь куда перемещать заметку')
			.addText(text => text
				.setPlaceholder('Введите путь куда перемещать заметку')
				.onChange(async (value) => {
					console.log('Путь куда перемещать заметку: ', value);
					// Здесь можно сохранить значение в настройки плагина
				}));

		// Кнопка для добавления правила
		const addRuleButton = document.createElement('button');
		addRuleButton.textContent = 'Добавить правило';
		addRuleButton.onclick = () => {
			const attributeRuleContainer = ruleContainer.createDiv('attribute-rule-container');
			attributeRuleContainer.addClass('attribute-rule-group');

			// Поле для ввода имени атрибута заметки
			new Setting(attributeRuleContainer)
				.setName('Имя атрибута')
				.addText(text => text
					.setPlaceholder('Введите имя атрибута (например, tags, alias)')
					.onChange(async (value) => {
						console.log('Имя атрибута: ', value);
						// Здесь можно сохранить значение в настройки плагина
					}));

			// Поле для ввода самого правила
			new Setting(attributeRuleContainer)
				.setName('Правило')
				.addText(text => text
					.setPlaceholder('Введите правило')
					.onChange(async (value) => {
						console.log('Правило: ', value);
						// Здесь можно сохранить значение в настройки плагина
					}));
		};

		ruleContainer.appendChild(addRuleButton);
	}
}