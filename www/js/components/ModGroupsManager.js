export class ModGroupsManager {
    constructor(app) {
        this.app = app;
        this.groups = {}; // { groupName: [modName1, modName2] }
    }

    setGroups(groups) {
        this.groups = groups || {};
    }

    getGroups() {
        return this.groups;
    }

    createGroup(name) {
        if (!name || this.groups[name]) return false;
        this.groups[name] = [];
        this.save();
        return true;
    }

    deleteGroup(name) {
        const trimmedName = name.trim();
        if (this.groups[trimmedName]) {
            delete this.groups[trimmedName];
            this.save();
            return true;
        }
        return false;
    }

    addModToGroup(groupName, modName) {
        // Remove from other groups first
        this.removeModFromAllGroups(modName);

        if (this.groups[groupName]) {
            if (!this.groups[groupName].includes(modName)) {
                this.groups[groupName].push(modName);
                this.save();
                return true;
            }
        }
        return false;
    }

    removeModFromAllGroups(modName) {
        let changed = false;
        for (const group in this.groups) {
            const index = this.groups[group].indexOf(modName);
            if (index !== -1) {
                this.groups[group].splice(index, 1);
                changed = true;
            }
        }
        return changed;
    }

    getModGroup(modName) {
        for (const group in this.groups) {
            if (this.groups[group].includes(modName)) return group;
        }
        return null;
    }

    save() {
        if (window.chrome && window.chrome.webview) {
            window.chrome.webview.postMessage({
                type: 'UPDATE_MOD_GROUPS',
                groups: this.groups
            });
        }
    }
}
