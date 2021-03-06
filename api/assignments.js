const db = require("../lib/database");
const assignments = require("../model/assignments").model;
const submissions = require("../model/submissions").model;
const storage = require("../lib/storage");

module.exports = (app) => {
    /*
      Function: Create a new assignment
      url: localhost:3000/assignments

      Create and store a new Assignment with specified data and adds it to the application's database.
    */
    app.post("/assignments", async (req, res) => {
        /*
          Authentication check:
          Only an authenticated User with 'admin' role or an authenticated 'instructor' User whose ID
          matches the instructorId of the Course corresponding to the Assignment's courseId can
          create an Assignment.
        */
        const assignment = await db.save(assignments, new assignments(req.body), res);
        if (assignment)
        {
          res.status(201).send({ assignment: assignment._id })
        }
        return
    });

    /*
      Function: Fetch data about a specific assignment
      url: localhost:3000/assignments/:id

      Returns summary data about the Assignment, excluding the list of Submissions.
    */
    app.get("/assignments/:id", async (req,res) => {
      const id = req.params.id
      const assignmentData = await db.find(assignments, id, res)

      if(assignmentData)
      {
        res.status(200).send({
          assignmentData
        })
      }
      return
    })

    /*
      Function: Update data for a specific assignment
      url: localhost:3000/assignments/:id

      Performs a partial update on the data for the Assignment.
      NOTE:  that submissions cannot be modified via this endpoint.
    */
   app.patch("/assignments/:id", async(req,res) => {
      /*
          AUTHENTICATION:
          Only an authenticated User with 'admin' role or an authenticated 'instructor' User whose ID matches the
          instructorId of the Course corresponding to the Assignment's courseId can update an Assignment.
       */
       const id = req.params.id
       const oldAssignment = await db.find(assignments, id, res)

       if(oldAssignment)
       {
         if(req.body && (req.body.title || req.body.points || req.body.due))
         {
           const title = req.body.title || oldAssignment.title
           const points = req.body.points || oldAssignment.points
           const due = req.body.due || oldAssignment.due

           const update = {
             title : title,
             points : points,
             due : due
           }

           const filter = { _id: req.params.id }
           const oldDocument = await assignments.updateOne({ _id: id }, update)

           res.status(204).send({})
         }
         else
         {
           res.status(400).send({
             err: "ERROR: Missing items from the request body (title, points, due)"
           })
         }
       }
       return
   })

    /*
      Function: Remove a specific assignment from the database.
      url: localhost:3000/assignments/:id

      NOTE: Completely removes the data for the specified Assignment, including all submissions.
    */

    app.delete("/assignments/:id", async(req,res) => {
      /*
        AUTHENTICATION:
        Only an authenticated User with 'admin' role or an authenticated 'instructor' User whose ID matches the instructorId of
        the Course corresponding to the Assignment's courseId can delete an Assignment.
      */
      const id = req.params.id
      const assignmentExist = await db.find(assignments, id, res)

      if(assignmentExist)
      {
        assignmentExist.remove()
        // also remove all the submissions along with it.
        submissions.deleteMany({ assignmentId: id }, function(err){
          if(err)
          {
            console.log(err)
          }
          console.log("Successful deletion")
        })

        res.status(204).send({})
      }
      return
    })

    /*
      Function: Fetch the list of all submissions for an assignment.
      url: localhost:3000/assignments/:id/submissions

      == PAGINATION REQUIRED
    */
    app.get("/assignments/:id/submissions", async(req,res) => {
      /*
        AUTHENTICATION:
        Only an authenticated User with 'admin' role or an authenticated 'instructor' User whose ID
        matches the instructorId of the Course corresponding to the Assignment's courseId can fetch the Submissions for an Assignment.
      */
      var pageNum = parseInt(req.query.page) || 1
      const result = await db.getByPage(submissions, pageNum, res, "")

        if (result) {
            res.status(200).send({
                courses: result
            });
        }
        return;
    })

    /*
      Function: Create a new submission for an assignment
      url: localhost:3000/assignments/:id/submissions
    */
    app.post("/assignments/:id/submissions", storage.upload.single("file"), async(req,res) => {
      /*
        AUTHENTICATION:
        Only an authenticated User with 'student' role who is enrolled in the Course corresponding to the Assignment's
        courseId can create a Submission.
      */
        if (req.body.grade != undefined) {
            res.status(400).send({ error: "You can't grade your own assignment :/" });
            return;
        }
        if (!req.file) {
            res.status(400).send({ error: "Unsupported file type" });
            return;
        }
        const file = {
            filename: req.file.filename,
            path: req.file.path,
            metadata: {
                contentType: req.file.mimetype,
                studentId: req.body.studentId,
            },
        };
        req.body.file = req.file.filename;
        await storage.saveFile(file);
        await storage.removeUploadedFile(req.file);
        const submission = await db.save(submissions, new submissions(req.body), res);
        if (!submission) return;
        res.status(201).send({
            submissionId: submission.id,
        });
        return
    })

    app.patch("/submissions/:id", async(req,res) => {
      /*
        AUTHENTICATION:
        Only an authenticated User with 'student' role who is enrolled in the Course corresponding to the Assignment's
        courseId can create a Submission.
      */
      // Grade :  Should not be accepted during submission creation, only via update.
      const id = req.params.id
      const oldSubmission = await db.find(submissions, id, res)

      if(oldSubmission)
      {
        if(req.body && req.body.grade)
        {
          const update = {
            grade: req.body.grade
          }

          const filter = { _id: req.params.id }
          const oldDocument = await submissions.updateOne({ _id: id }, update)

          res.status(204).send({})
        }
        else
        {
          res.status(400).send({
            err: "ERROR: Missing grade from the request body."
          })
        }
      }
      return
    })
};
