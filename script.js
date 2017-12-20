$("#top-level-new-comment").html(generateNewCommentFormHtml());

Handlebars.registerHelper("timeFromNow", function(timestamp) {
  console.log(timestamp);
  return moment.unix(timestamp/1000).fromNow();
});

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
      reply.id = key;
      renderComment($("[data-id="+comment.id+"] .replies:eq(0)"), reply);
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
  var content = $(this).find("[name=content]").val().replace(/\n/g,"<br>");
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

  // a cheat... lol
  window.location.reload(true);
});

$("#comments").on("click", ".btn-reply", function(event) {
  var $reply = $(this).parent().find(".reply");
  $reply.html(generateNewCommentFormHtml($(this).data("id")));
});

$("#comments").on("click", "img", function(event) {
  var $comment = $(this).parents(".comment:eq(0)");
  var commentKey = $comment.data("id");

  var refPaths = [];
  $(this).parents(".comment").each(function() {
    refPaths.push($(this).data("id"));
  });

  var ref = 'comments/' + refPaths.reverse().join("/replies/");
  var currentCount = parseInt($comment.find(".count:eq(0)")[0].innerText);
  var newCount = currentCount;

  if ($(this).hasClass("upvote")) {
    newCount++;
  }

  if ($(this).hasClass("downvote")) {
    newCount--;
  }

  var commentRef = firebase.database().ref(ref).update({
    voteCount: newCount,
  });
  $comment.find(".count:eq(0)")[0].innerText = newCount;
});
