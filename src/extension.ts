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
    // エディターの選択範囲を取得する
    const selection = editor.selection;
    const line = editor.document.lineAt(selection.start.line);
    const command = line.text;

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

    // 出力結果をエディターに表示する
    childProcess.stdout.on('data', (data: Buffer) => {
      editor.edit((editBuilder) => {
        editBuilder.insert(new vscode.Position(editor.document.lineCount - 1, 0), `$ ${command.toString()}`); // コマンドを表示
        editBuilder.insert(new vscode.Position(editor.document.lineCount - 1, 0), '\n');
      });

      editor.edit((editBuilder) => {
        editBuilder.insert(
          new vscode.Position(editor.document.lineCount - 1, 0), // 最後の行
          data.toString() // 出力結果
        );
        // 空行を入れる
        editBuilder.insert(new vscode.Position(editor.document.lineCount - 1, 0), '\n');
      });
    });


    // childProcess.stdout.on('data', (data: Buffer) => {
    //   terminal.sendText(data.toString());
    // });
    childProcess.stderr.on('data', (data: Buffer) => {
      terminal.sendText(data.toString());
    });

    childProcess.on('exit', () => {
      // vscode.window.showInformationMessage('Command has been executed');

      editor.edit((editBuilder) => {
        // 最後の行を削除
        editBuilder.delete(new vscode.Range(new vscode.Position(editor.document.lineCount - 1, 0), new vscode.Position(editor.document.lineCount - 1, 100)));
      });
    });
  });

  context.subscriptions.push(disposable);
}
