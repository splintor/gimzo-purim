Originally, the Mishloach Manot system of Gimzo was done in [jotform.com](http://jotform.com). I decided to move to do
it with my own React app (with the Remix framework) that saves the data directly to a Google Spreadsheet
for the following benefits:

* **Pricing** - Jotform is a paid service for over 100 submission per month, so we had to pay for a month every year for
  its Purim session. The new solution is free.
* **Data Customization** - The family names are taken directly from the Google spreadsheet, and no need to manually copy
  them to jot form. In addition, I added an "options" sheet in the spreadsheet, to enable easy customization of the
  form behavior (like when to disable the form when it is no longer needed).
* **Design** - I now have more control on how the UI looks. Mainly, I can have better UX for selecting families to send
  to.
* **Submission Simplicity** - Since we control the data we submit, we can now submit only the data we need, and not all
  the form temporary fields.
* **Logic Control** - I can now more easily control the UI logic and sum calculation, since it is done in TypeScript and
  not in Jotform rules UI.
* **Version Control** - I can now use git to track changes in the code, and revert to previous versions if needed.
* **Logging** - I can log actions in Telegram and get notified when something happens in the form (submissions, error).
* **Learning** - I get a change to learn new technologies I haven't worked with - the Remix framework, talking with
  Google Spreadsheet.
* **Cloning** - Being open source, I can easily share the project with others which might want the same (or similar)
  solution.
* **Continuity** - The same system can be easily used year over year, and I don't need to clone the form and the
  spreadsheet we use - only clear the old submissions.
