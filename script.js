$("#top-level-new-comment").html(generateNewCommentFormHtml());

// Initialize Firebase
var config = {
  apiKey: "AIzaSyCnsLQADcST8iP5J8S8DxW5D9t94FaTTZI",
  authDomain: "goodbyeluke-90a2a.firebaseapp.com",
  databaseURL: "https://goodbyeluke-90a2a.firebaseio.com",
  projectId: "goodbyeluke-90a2a",
  storageBucket: "goodbyeluke-90a2a.appspot.com",
  messagingSenderId: "845217543340"
};

firebase.initializeApp(config);

firebase.auth().signInAnonymously().catch(function(error) {
  console.log("error", error);
});

firebase.auth().onAuthStateChanged(function(user) {
  if (user) {
    // User is signed in.
    var isAnonymous = user.isAnonymous;
    var uid = user.uid;
    // ...
    console.log("user");
    renderAllComments();
  } else {
    // User is signed out.
    // ...
    console.log("out");
  }
});

function createCommentHTML(comment) {
  var source = document.getElementById("comment-template").innerHTML;
  var template = Handlebars.compile(source);

  return template(comment);
}

function renderAllComments() {
  var $conatiner = $("#comments");

  firebase.database().ref('/comments').once('value').then(function(snapshot) {
    var comments = snapshot.val();

    $("#comments-section header").text("all " + Object.keys(comments).length + " comments");
    Object.keys(comments).forEach(function(key) {
      var comment = comments[key];
      comment.id = key;
      renderComment($conatiner, comment);
    })
  });
}

function renderComment($conatiner, comment) {
  // var commentsRef = firebase.database().ref('comments/' + id);
  // commentsRef.on('value', function(snapshot) {
  //   var comment = snapshot.val();
  //   console.log(comment);
  // });
  $conatiner.append(createCommentHTML(comment));

  if (comment.replies) {
    Object.keys(comment.replies).forEach(function(key) {
      var reply = comment.replies[key];
      // console.log(reply, $("[data-id="+comment.id+"]"));
      reply.id = key;
      renderComment($("[data-id="+comment.id+"] .replies"), reply);
    });
  }
}

function generateNewCommentFormHtml(parentId) {
  console.log(parentId);
  var source = document.getElementById("new-comment-template").innerHTML;
  var template = Handlebars.compile(source);

  return template({parentId: parentId});
}


$("body").on("submit", ".new-comment", function(event) {
  event.preventDefault();

  var timestamp = Date.now().toString();
  var submitter = $(this).find("[name=submitter]").val();
  var content = $(this).find("[name=content]").val();
  var imgSrc = $(this).find("[name=imgSrc]").val();
  var paretnId = $(this).data("parent-id");

  var ref = "comments";
  if (paretnId) {
    ref = ref + "/" + paretnId + "/replies";
  }
  var newCommentRef = firebase.database().ref(ref).push();

  newCommentRef.set({
    timestamp: timestamp,
    voteCount: 0,
    submitter: submitter,
    content: content,
    imgSrc: imgSrc,
    replies: null
  });

  // clear form
  $("[name=submitter], [name=content], [name=imgSrc]").val("");
});

$("#comments").on("click", ".btn-reply", function(event) {
  event.stopPropagation();

  var $reply = $(this).parent().find(".reply");
  $reply.html(generateNewCommentFormHtml($(this).data("id")));
});
