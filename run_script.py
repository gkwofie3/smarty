import webview
import sys

def main():
    webview.create_window('Smarty Script', 'http://localhost:5005')
    webview.start()

if __name__ == '__main__':
    main()
