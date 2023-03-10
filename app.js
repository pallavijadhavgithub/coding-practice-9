const express = require("express");
const sqlite3 = require("sqlite3");
const { open } = require("sqlite");
const path = require("path");
const bcrypt = require("bcrypt");

const app = express();
module.exports = app;

const filePath = path.join(__dirname, "userData.db");
let db = null;
app.use(express.json());

const initializerDbAndServer = async () => {
  try {
    db = await open({
      filename: filePath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000");
    });
  } catch (e) {
    console.log(`Error : ${e.message}`);
    process.exit(1);
  }
};
initializerDbAndServer();

//register API 1
app.post("/register", async (request, response) => {
  const { username, name, password, gender, location } = request.body;
  const hashedPassword = await bcrypt.hash(request.body.password, 10);

  const selectUserQuery = `
        SELECT * 
        FROM user
        WHERE username = '${username}';`;
  const dbUser = await db.get(selectUserQuery);

  if (dbUser === undefined) {
    const createUserQuery = `
        INSERT INTO 
            user (username,name,password, gender,location)
        VALUES (
            '${username}',
            '${name}',
            '${hashedPassword}',
            '${gender}',
            '${location}'
        )`;
    await db.run(createUserQuery);
    response.status(200);
    response.send("User created successfully");
  } else {
    if (password.length < 5) {
      response.status(400);
      response.send("Password is too short");
    } else {
      response.status(400);
      response.send("User already exists");
    }
  }
});

//login API 2
app.post("/login", async (request, response) => {
  const { username, password } = request.body;
  const selectUserQuery = `
        SELECT * 
        FROM user
        WHERE username = '${username}'; `;
  const dbUser = await db.get(selectUserQuery);
  if (dbUser === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const isPasswordMatched = await bcrypt.compare(password, dbUser.password);
    if (isPasswordMatched === true) {
      response.status(200);
      response.send("Login success!");
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  }
});

//put API 3
app.put("/change-password", async (request, response) => {
  const { username, oldPassword, newPassword } = request.body;

  const selectUserQuery = `
        SELECT * 
        FROM user
        WHERE username = '${username}'; `;
  const dbUser = await db.get(selectUserQuery);

  if (dbUser === undefined) {
    response.status(400);
    response.send("User not Registered");
  } else {
    const isValidPassword = await bcrypt.compare(oldPassword, dbUser.password);
    if (isValidPassword === true) {
      if (newPassword.length < 5) {
        response.status(400);
        response.send("Password is too short");
      } else {
        const encryptedPassword = await bcrypt.hash(newPassword, 10);
        const updatePasswordQuery = `
                UPDATE 
                    user
                SET 
                password = '${encryptedPassword}'
                WHERE 
                    username = '${username}'`;
        await db.run(updatePasswordQuery);
        // response.status(200);
        response.send("Password updated");
      }
    } else {
      response.status(400);
      response.send("Invalid current password");
    }
  }
});
