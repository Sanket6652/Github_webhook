## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/wellnessz.git
cd wellnessz
```
### 2. Setup Environment Variables
Create a .env file in both the server and client directories with the following contents:
Server .env File
Create a .env file in the server directory:
```bash
PORT=3000
MONGO_URI=your_mongodb_connection_string
GITHUB_SECRET=your_github_webhook_secret
```

### 3. Install Dependencies
```bash
cd server
npm install
# or
yarn install
```
## Running the Application
###  1. Running the Application
```bash
cd server
npm start
# or
yarn start
```

### 2. Start ngrok

To expose your local server to the internet for GitHub webhooks, use ngrok:

#### 1. Install ngrok if you haven't already. You can download it from ngrok.com or install via npm:
```bash
  npm install -g ngrok
```
#### 2. Start ngrok to tunnel your local server
```bash
 ngrok http 3000
```
This will provide a public URL (e.g., https://abcd1234.ngrok.io) that tunnels to http://localhost:3000.

#### 3. Add ngrok URL to GitHub Secrets
# Setting up NGROK URL as a GitHub Secret

Follow these steps to set up your NGROK HTTPS URL as a GitHub secret for your repository:

1. **Copy the ngrok HTTPS URL:**
   - Start your ngrok tunnel by running the command in your terminal:
     ```bash
     ngrok http 80
     ```
   - Copy the provided HTTPS URL from the terminal output (e.g., `https://abcd1234.ngrok.io`).

2. **Navigate to your GitHub repository:**
   - Go to [GitHub](https://github.com) and navigate to your repository.

3. **Go to Settings:**
   - In your GitHub repository, click on the `Settings` tab.

4. **Access Webhook:**
   - In the left sidebar, go to **Secrets and variables** and then click on **Actions**.

5. **Add a new webhook:**
   - Click on the **add Webhook** button.

6. **Add Playload URL:**
   - `https://your-ngrok-url.ngrok.io/webhook/github`
   
7. **Add content type:**
   - Select  the **application/json** button to save the new secret.
     
8. **Add Secret**
   - Add Secret here from server .nev .
     
9. **Click on Add WEbhook**


Now start the server


