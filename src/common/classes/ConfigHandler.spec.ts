import 'jasmine';
const mock = require('mock-fs');
import * as fs from 'fs';
import * as path from 'path';

import { ConfigHandler } from './ConfigHandler';
import { TccSettings } from '../models/TccSettings';
import { TccProfile } from '../models/TccProfile';
import { TccPaths } from './TccPaths';

describe('ConfigHandler file IO', () => {

    const config = new ConfigHandler('/etc/test1/test2/settings.conf', '/etc/test1/test2/profiles.conf');

    // Mock file structure in memory
    beforeEach(() => {
        mock({
            '/etc': {}
        });
    });

    afterEach(() => {
        mock.restore();
    });

    it('should start without configs or folder', () => {
        expect(fs.existsSync(path.dirname(TccPaths.SETTINGS_FILE))).toBe(false);
        expect(fs.existsSync(TccPaths.SETTINGS_FILE)).toBe(false);
        expect(fs.existsSync(TccPaths.PROFILES_FILE)).toBe(false);
    });

    it('should write to a settings file with mode 644', () => {
        const settings = new TccSettings();
        settings.activeProfileName = 'some profile';
        expect(() => { config.writeSettings(settings, '/etc/test.conf'); }).not.toThrow();
        expect(fs.existsSync('/etc/test.conf')).toBe(true);
        // tslint:disable-next-line: no-bitwise
        expect(fs.statSync('/etc/test.conf').mode & 0o777).toBe(0o644);
    });

    it('should create folders with mode 755 if they do not exist', () => {
        const settings = new TccSettings();
        settings.activeProfileName = 'some profile';
        expect(() => { config.writeSettings(settings, '/etc/test/test.conf'); }).not.toThrow();
        expect(fs.existsSync('/etc/test')).toBe(true);
        // tslint:disable-next-line: no-bitwise
        expect(fs.statSync('/etc/test').mode & 0o777).toBe(0o755);
        expect(() => { config.writeSettings(settings, '/etc/test1/test2/test3/test.conf'); }).not.toThrow();
        expect(fs.existsSync('/etc/test1/test2/test3')).toBe(true);
        // tslint:disable-next-line: no-bitwise
        expect(fs.statSync('/etc/test1/test2/test3').mode & 0o777).toBe(0o755);
    });

    it('should read settings from a written file', () => {
        const settings = new TccSettings();
        settings.activeProfileName = 'profile1';
        expect(() => { config.writeSettings(settings); }).not.toThrow();

        let readSettings: TccSettings;
        expect(() => { readSettings = config.readSettings(); }).not.toThrow();
        expect(readSettings.activeProfileName).toEqual('profile1');
    });

    it ('should write to a profiles file with mode 644', () => {
        const profiles: TccProfile[] = new Array();
        expect(() => { config.writeProfiles(profiles, '/etc/test.conf'); }).not.toThrow();
        expect(fs.existsSync('/etc/test.conf')).toBe(true);
        // tslint:disable-next-line: no-bitwise
        expect(fs.statSync('/etc/test.conf').mode & 0o777).toBe(0o644);
    });

    it('should write and read multiple profiles', () => {
        const profiles: TccProfile[] = new Array();
        const profile1 = new TccProfile();
        profile1.name = 'some profile';
        profile1.keyboardBrightness = 50;
        profile1.screenBrightness = 12;
        const profile2 = new TccProfile();
        profile2.name = 'some other profile';
        profile2.keyboardBrightness = 30;
        profile2.screenBrightness = 100;

        profiles.push(profile1);
        profiles.push(profile2);
        expect(() => { config.writeProfiles(profiles); }).not.toThrow();
        expect(fs.existsSync(config.pathProfiles)).toBe(true);

        let readProfiles: TccProfile[];
        expect(() => { readProfiles = config.readProfiles(); }).not.toThrow();
        expect(readProfiles.length).toEqual(2);
        for (const profile of readProfiles) {
            expect(['some profile', 'some other profile'].includes(profile.name)).toBe(true);
            if (profile.name === 'some profile') {
                expect(profile.keyboardBrightness).toBe(50);
                expect(profile.screenBrightness).toBe(12);
            }
            if (profile.name === 'some other profile') {
                expect(profile.keyboardBrightness).toBe(30);
                expect(profile.screenBrightness).toBe(100);
            }
        }
    });

    it('should write and read multiple profiles with missing values', () => {
        const profiles: TccProfile[] = new Array();
        const profile1 = new TccProfile();
        profile1.name = 'some profile';
        profile1.screenBrightness = 15;
        const profile2 = new TccProfile();
        profile2.name = 'some other profile';
        profile2.keyboardBrightness = 25;

        profiles.push(profile1);
        profiles.push(profile2);
        expect(() => { config.writeProfiles(profiles); }).not.toThrow();
        expect(fs.existsSync(config.pathProfiles)).toBe(true);

        let readProfiles: TccProfile[];
        expect(() => { readProfiles = config.readProfiles(); }).not.toThrow();
        expect(readProfiles.length).toEqual(2);
        for (const profile of readProfiles) {
            expect(['some profile', 'some other profile'].includes(profile.name)).toBe(true);
            if (profile.name === 'some profile') {
                expect(profile.keyboardBrightness).toBeUndefined();
                expect(profile.screenBrightness).toBe(15);
            }
            if (profile.name === 'some other profile') {
                expect(profile.keyboardBrightness).toBe(25);
                expect(profile.screenBrightness).toBeUndefined();
            }
        }
    });
});
