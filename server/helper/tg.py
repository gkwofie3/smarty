import asyncio
from telegram import Bot
from telegram.constants import ParseMode

# --- CONFIGURATION (Move these to settings.py in production) ---
TOKEN = "8364680113:AAFxhCR_tJVUr6bAXpzFWEQiFL8dX_vBJR8"
CHAT_ID = "-1003430889135" # e.g., "-100123456789"

async def send_telegram_notification(text: str):
    
    bot = Bot(token=TOKEN)
    
    # Using 'async with' ensures the bot session is closed correctly
    async with bot:
        try:
            await bot.send_message(
                chat_id=CHAT_ID,
                text=text,
                parse_mode=ParseMode.MARKDOWN_V2
            )
            print("Successfully sent BMS alert.")
        except Exception as e:
            print(f"Failed to send message: {e}")

def send(message):
    asyncio.run(send_telegram_notification(message))