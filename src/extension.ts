import * as vscode from 'vscode';
import { spawn } from 'child_process';

export function activate(context: vscode.ExtensionContext) {

  let terminal: vscode.Terminal;

  const disposable = vscode.commands.registerCommand('integrated-terminal-runner.exec', async () => {
    // if (!terminal) {
    //   terminal = vscode.window.createTerminal('My Terminal');
    // }
    // terminal.show();

    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showInformationMessage('No editor is active');
      return;
    }
    // フォーカスしている行のテキストを取得する
    const selection = editor.selection;
    const line = editor.document.lineAt(selection.start.line);
    const command = line.text.replace(/^\$/, '');
    // command.replace(/^\$/, ''); // 取得したコマンドから先頭の$を削除する

    vscode.window.showInformationMessage(command.toString());

    // 開いているフォルダのパスを取得する
    const workspaceFolder = vscode.workspace.workspaceFolders;
    let currentPath = '~/';
    if (workspaceFolder) {
      currentPath = workspaceFolder[0].uri.fsPath.toString();
    }
    // vscode.window.showInformationMessage(currentPath);

    // コマンドを実行する
    const childProcess = spawn(`cd ${currentPath} && ${command}`, [], { shell: true });
    // const childProcess = terminal.sendText(command.toString());

    let output = '';
    // 出力結果をエディターに表示する
    childProcess.stdout.on('data', (data: Buffer) => {
      output += data.toString();
    });

    childProcess.stderr.on('data', (data: Buffer) => {
      console.error(data.toString());

      output += data.toString();
    });

    // コマンド実行後の処理
    childProcess.on('close', () => {
      vscode.window.showInformationMessage('Command has been executed');

      editor.edit((editBuilder) => {
        editBuilder.insert(new vscode.Position(editor.document.lineCount - 1, 0), `$ ${command.toString()}`); // コマンドを表示
        editBuilder.insert(new vscode.Position(editor.document.lineCount - 1, 0), '\n');

        editBuilder.insert(
          new vscode.Position(editor.document.lineCount - 1, 0), // 最後の行
          output.toString() // 出力結果
        );
        console.log(output.toString());

        // 空行を入れる
        editBuilder.insert(new vscode.Position(editor.document.lineCount - 1, 0), '\n');

        // 実行したコマンド業を削除する
        const lastLine = editor.document.lineAt(editor.document.lineCount - 1);
        editBuilder.delete(lastLine.range);

        editBuilder.insert(new vscode.Position(editor.document.lineCount - 1, 0), '$ ');
      });
    });
  });

  context.subscriptions.push(disposable);
}
