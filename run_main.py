import webview
import sys

def main():
    webview.create_window('Smarty Main', 'http://localhost:5001')
    webview.start()

if __name__ == '__main__':
    main()
