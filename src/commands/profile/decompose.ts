import {flags} from '@oclif/command';
import {join} from 'path';
import {SfdxCommand, core} from '@salesforce/command';
import { SfdxUtil } from '@salesforce/core';
import { existsSync } from 'fs';

core.Messages.importMessagesDirectory(join(__dirname, '..', '..', '..'));
const messages = core.Messages.loadMessages('survey', 'org');

export default class Org extends SfdxCommand {

  public static description = messages.getMessage('commandDescription');

  public static examples = [
  `$ sfdx hello:org --targetusername myOrg@example.com --targetdevhubusername devhub@org.com
  Hello world! This is org: MyOrg and I will be around until Tue Mar 20 2018!
  My hub org id is: 00Dxx000000001234
  `,
  `$ sfdx hello:org --name myname --targetusername myOrg@example.com
  Hello myname! This is org: MyOrg and I will be around until Tue Mar 20 2018!
  `
  ];

  public static args = [{name: 'file'}];

  protected static flagsConfig = {
    // flag with a value (-n, --name=VALUE)
    name: flags.string({char: 'n', description: messages.getMessage('nameFlagDescription')}),
    force: flags.boolean({char: 'f'})
  };

  // Comment this out if your command does not require an org username
  protected static requiresUsername = true;

  // Comment this out if your command does not support a hub org username
  protected static supportsDevhubUsername = true;

  // Set this to true if your command requires a project workspace; 'requiresProject' is false by default
  protected static requiresProject = false;

  public async run(): Promise<any> { // tslint:disable-line:no-any
    const name = this.flags.name || 'world';
    const profileName: string = 'Admin';
    // tslint:disable-next-line:no-any
    const prof: any = await core.SfdxUtil.readJSON('./' + profileName + '.profile-meta.json');
    const targetRoot: string = './profile/' + profileName + '/';
    await core.SfdxUtil.mkdirp(targetRoot + 'applicationVisibilities');
    await core.SfdxUtil.mkdirp(targetRoot + 'classAccesses');
    await core.SfdxUtil.mkdirp(targetRoot + 'objectPermissions');
    await core.SfdxUtil.mkdirp(targetRoot + 'customPermissions');
    await core.SfdxUtil.mkdirp(targetRoot + 'pageAccesses');
    await core.SfdxUtil.mkdirp(targetRoot + 'tabVisibilities');
    await core.SfdxUtil.mkdirp(targetRoot + 'userPermissions');

    const profileMeta = {
      custom: prof.Profile.custom,
      userLicense: prof.Profile.userLicense
    };

    await core.SfdxUtil.writeJSON(targetRoot + '/' + profileName + '.profile-meta.xml', profileMeta);

    for (const appvis of prof.Profile.applicationVisibilities) {
      const appName: string = appvis.application;
      this.ux.log(appName.replace('standard__', ''));
      this.ux.log('    custom: ' + !appName.startsWith('standard'));
      this.ux.log('    default: ' + appvis.default);
      this.ux.log('    visible: ' + appvis.visible + '\n');
      await core.SfdxUtil.writeJSON(targetRoot + 'applicationVisibilities/' + appvis.application + '.json', appvis);
    }

    for (const clsvis of prof.Profile.classAccesses) {
      const appName: string = clsvis.apexClass;
      this.ux.log(appName);
      this.ux.log('    enabled: ' + clsvis.enabled + '\n');
      await core.SfdxUtil.writeJSON(targetRoot + 'classAccesses/' + clsvis.apexClass + '.json', clsvis);
    }

    for (const custPerm of prof.Profile.customPermissions) {
      const permName: string = custPerm.name;
      await core.SfdxUtil.writeJSON(targetRoot + 'customPermissions/' + custPerm.name + '.json', custPerm);
    }

    for (const pageAccess of prof.Profile.pageAccesses) {
      const pageName: string = pageAccess.apexPage;
      await core.SfdxUtil.writeJSON(targetRoot + 'pageAccesses/' + pageAccess.apexPage + '.json', pageAccess);
    }

    for (const tabVisibility of prof.Profile.tabVisibilities) {
      const tabName: string = tabVisibility.tab;
      await core.SfdxUtil.writeJSON(targetRoot + 'tabVisibilities/' + tabVisibility.tab + '.json', tabVisibility);
    }

    for (const userPerm of prof.Profile.userPermissions) {
      const permName: string = userPerm.name;
      await core.SfdxUtil.writeJSON(targetRoot + 'userPermissions/' + permName + '.json', userPerm);
    }

    for (const objPerm of prof.Profile.objectPermissions) {
      await core.SfdxUtil.mkdirp(targetRoot + 'objectPermissions/' + objPerm.object);
      await core.SfdxUtil.writeJSON(targetRoot + 'objectPermissions/' + objPerm.object + '/' + objPerm.object + '.json', objPerm);
      await core.SfdxUtil.mkdirp(targetRoot + 'objectPermissions/' + objPerm.object + '/fieldPermissions');
    }

    for (const fieldPerm of prof.Profile.fieldPermissions) {
      const fqFieldName: string = fieldPerm.field;
      const objName = fqFieldName.split('.')[0];
      const fieldName = fqFieldName.split('.')[1];
      const fPermFolder = targetRoot + 'objectPermissions/' + objName + '/fieldPermissions';
      if (!existsSync(fPermFolder)) {
        await SfdxUtil.mkdirp(fPermFolder);
      }
      await core.SfdxUtil.writeJSON(fPermFolder + '/' + fieldName + '.json', fieldPerm);
    }

    for (const layoutAssignment of prof.Profile.layoutAssignments) {
      const fqLayoutName: string = layoutAssignment.layout;
      const objName = (layoutAssignment.recordType) ? layoutAssignment.recordType.split('.')[0] : layoutAssignment.layout.split('-')[0];
      const fLayoutFolder = targetRoot + 'objectPermissions/' + objName + '/layoutAssignments';
      if (!existsSync(fLayoutFolder)) {
        await SfdxUtil.mkdirp(fLayoutFolder);
      }
      await core.SfdxUtil.writeJSON(fLayoutFolder + '/' + fqLayoutName + '.json', layoutAssignment);
    }

    for (const rtypeVisibility of prof.Profile.recordTypeVisibilities) {
      const fqRecordType: string = rtypeVisibility.recordType;
      const objName = fqRecordType.split('.')[0];
      // : layoutAssignment.layout.split('-')[0];
      const fRecordTypeFolder = targetRoot + 'objectPermissions/' + objName + '/recordTypeVisibilities';
      if (!existsSync(fRecordTypeFolder)) {
        await SfdxUtil.mkdirp(fRecordTypeFolder);
      }
      await core.SfdxUtil.writeJSON(fRecordTypeFolder + '/' + rtypeVisibility.recordType + '.json', rtypeVisibility);
    }

    // tslint:disable-next-line:no-debugger
    debugger;
    // this.ux.prompt('What kind of source control system do you use regularly',
    // { type: 'normal'});
  }
}
