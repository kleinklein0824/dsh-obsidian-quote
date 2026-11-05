/* Minimal Obsidian API stub for auditing panel/main logic without the app. */

export class El {
	constructor(tag = "div") {
		this.tagName = tag;
		this.children = [];
		this.classes = new Set();
		this.textContent = "";
		this.attrs = {};
		this.listeners = {};
		this.value = "";
		this.inputEl = this;
		this.rows = 0;
		this.readOnly = false;
		this.type = "";
		this.min = "";
		this.max = "";
		this.step = "";
	}
	empty() {
		this.children = [];
		this.textContent = "";
	}
	addClass(cls) {
		this.classes.add(cls);
	}
	setText(text) {
		this.textContent = String(text);
	}
	setAttribute(key, value) {
		this.attrs[key] = value;
	}
	createEl(tag, opts = {}) {
		const el = new El(tag);
		if (opts.text !== undefined) el.textContent = String(opts.text);
		if (opts.cls) el.addClass(opts.cls);
		this.children.push(el);
		return el;
	}
	createDiv(opts = {}) {
		return this.createEl("div", opts);
	}
	createSpan(opts = {}) {
		return this.createEl("span", opts);
	}
	addEventListener(type, fn) {
		(this.listeners[type] ||= []).push(fn);
	}
	fire(type, event = {}) {
		for (const fn of this.listeners[type] || []) fn(event);
	}
	click() {
		this.fire("click");
	}
	blur() {
		this.fire("blur");
	}
	allText() {
		return [this.textContent, ...this.children.map((child) => child.allText())].filter(Boolean).join(" ");
	}
	find(predicate, out = []) {
		for (const child of this.children) {
			if (predicate(child)) out.push(child);
			child.find(predicate, out);
		}
		return out;
	}
	findClass(cls) {
		return this.find((el) => el.classes.has(cls));
	}
}

export class Notice {
	constructor(message) {
		Notice.messages.push(String(message));
	}
	static messages = [];
}

export class Plugin {
	constructor(app, manifest) {
		this.app = app;
		this.manifest = manifest;
		this.__data = null;
		this.commands = [];
		this.ribbon = [];
		this.views = [];
		this.tabs = [];
	}
	addRibbonIcon(icon, title, callback) {
		this.ribbon.push({ icon, title, callback });
	}
	addCommand(command) {
		this.commands.push(command);
	}
	registerView(type, factory) {
		this.views.push({ type, factory });
	}
	addSettingTab(tab) {
		this.tabs.push(tab);
	}
	async loadData() {
		return this.__data;
	}
	async saveData(data) {
		this.__data = data;
	}
}

export class ItemView {
	constructor(leaf) {
		this.leaf = leaf;
		this.app = leaf && leaf.app;
		this.contentEl = new El("div");
	}
}

export class PluginSettingTab {
	constructor(app, plugin) {
		this.app = app;
		this.plugin = plugin;
		this.containerEl = new El("div");
	}
}

function textControl(el) {
	const control = {
		inputEl: el,
		setPlaceholder(value) {
			el.attrs.placeholder = value;
			return control;
		},
		setValue(value) {
			el.value = String(value);
			return control;
		},
		onChange(fn) {
			el.listeners.change = [fn];
			return control;
		},
	};
	return control;
}

export class Setting {
	static all = [];
	constructor(container) {
		this.container = container;
		this.controls = [];
		this.name = "";
		this.desc = "";
		this.el = container.createDiv ? container.createDiv({ cls: "setting-item" }) : new El("div");
		Setting.all.push(this);
		if (container.__settings) container.__settings.push(this);
	}
	setName(name) {
		this.name = name;
		return this;
	}
	setDesc(desc) {
		this.desc = desc;
		return this;
	}
	addToggle(cb) {
		const toggleEl = this.el.createEl("input");
		toggleEl.type = "checkbox";
		const control = {
			toggleEl,
			value: false,
			setValue(value) {
				control.value = value;
				return control;
			},
			onChange(fn) {
				control.fn = fn;
				return control;
			},
			async toggle(value) {
				control.value = value;
				if (control.fn) await control.fn(value);
			},
		};
		this.controls.push({ type: "toggle", control });
		cb(control);
		return this;
	}
	addText(cb) {
		const el = this.el.createEl("input");
		const control = textControl(el);
		this.controls.push({ type: "text", control });
		cb(control);
		return this;
	}
	addTextArea(cb) {
		const el = this.el.createEl("textarea");
		const control = textControl(el);
		this.controls.push({ type: "textarea", control });
		cb(control);
		return this;
	}
	addDropdown(cb) {
		const el = this.el.createEl("select");
		const control = {
			selectEl: el,
			addOption(value, label) {
				const option = el.createEl("option", { text: label });
				option.value = value;
				return control;
			},
			setValue(value) {
				el.value = String(value);
				return control;
			},
			onChange(fn) {
				el.listeners.change = [fn];
				return control;
			},
		};
		this.controls.push({ type: "dropdown", control });
		cb(control);
		return this;
	}
	addButton(cb) {
		const el = this.el.createEl("button");
		const control = {
			buttonEl: el,
			setButtonText(text) {
				el.textContent = text;
				return control;
			},
			onClick(fn) {
				el.listeners.click = [fn];
				return control;
			},
		};
		this.controls.push({ type: "button", control });
		cb(control);
		return this;
	}
	addExtraButton(cb) {
		const el = this.el.createEl("button");
		const control = {
			buttonEl: el,
			extraSettingsEl: el,
			setIcon(icon) {
				el.attrs.icon = icon;
				return control;
			},
			setTooltip(text) {
				el.attrs.tooltip = text;
				return control;
			},
			onClick(fn) {
				el.listeners.click = [fn];
				return control;
			},
		};
		this.controls.push({ type: "extra", control });
		cb(control);
		return this;
	}
}

export class WorkspaceLeaf {}
export class App {}
