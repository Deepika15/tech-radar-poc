const router = require('express').Router();

//TODO: Consider login with microsoft group instead of seperate login system
  router.post("/login", async (req, res) => {
    const { body } = req;
    const { username, password } = body;

    const hashedPassword = await bcrypt.hash(password, 10);

    const account = await User.findOne({ username: username });
    if (account) {
      const checkPassword = await bcrypt.compare(hashedPassword, account.password);
      if (checkPassword) {
        res.status(200).json({ message: "Valid password" });
      } else {
        res.status(400).json({ error: "Invalid Password" });
      }
    } else {
      res.status(401).json({ error: "User does not exist" });
    }
  });

module.exports = router;