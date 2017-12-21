// please don't judge my code below lol
// my goal is to quickly get the page working :D

$("#top-level-new-comment").html(generateNewCommentFormHtml());
$("#main-post .timestamp").html(moment([2017,11,20]).fromNow());

Handlebars.registerHelper("timeFromNow", function(timestamp) {
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
    // var isAnonymous = user.isAnonymous;
    // var uid = user.uid;
    // console.log("user");

    renderAllComments(function() {
      var anchorElemId = window.location.hash;
      if (anchorElemId) {
        document.querySelector(anchorElemId).scrollIntoView({ behavior: "smooth" });
      }
    });
  } else {
    // User is signed out.
    // console.log("out");
  }
});

function createCommentHTML(comment) {
  var source = document.getElementById("comment-template").innerHTML;
  var template = Handlebars.compile(source);

  return template(comment);
}

function renderAllComments(done) {
  var $conatiner = $("#comments");

  firebase.database().ref('/comments').once('value').then(function(snapshot) {
    var comments = snapshot.val();

    $("#comments-section header").text("all " + Object.keys(comments).length + " comments");
    Object.keys(comments).forEach(function(key) {
      var comment = comments[key];
      comment.id = key;
      renderComment($conatiner, comment);
    })

    done();
  });
}


function isSrcVideo(filename = "") {
  var ext = filename.split("?")[0].split(".").pop();

  switch (ext.toLowerCase()) {
    case "mp4":
    case "avi":
    case "mpg":
      return true;
    }

  return false;
}


function renderComment($conatiner, comment) {
  // var commentsRef = firebase.database().ref('comments/' + id);
  // commentsRef.on('value', function(snapshot) {
  //   var comment = snapshot.val();
  //   console.log(comment);
  // });

  // check if imgSrc is actually a video...
  if (isSrcVideo(comment.imgSrc)) {
    comment.imgSrcIsVideo = true;
  }

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

function uploadImage(file, cb) {
  var storageRef = firebase.storage().ref("images/" + file.name);
  var task = storageRef.put(file); // upload file
  task.on("state_changed",
    function progress(snapshot) {
      // var percentage = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
      // progressBar.val(percentage);
    },
    function error(error) {

    },
    function complete() {
      var downloadURL = task.snapshot.downloadURL;
      cb(downloadURL);
    }
  );
}

// submit new comment
$("body").on("submit", ".new-comment", function(event) {
  event.preventDefault();

  var timestamp = Date.now().toString();
  var submitter = $(this).find("[name=submitter]").val();
  var content = $(this).find("[name=content]").val().replace(/\n/g,"<br>");
  var imgSrc = $(this).find("[name=imgSrc]").val();

  // ref to Firebase
  var ref = getOwnFullRefPathsFromDom($(this));
  if ($(this).parents(".comment").length > 0) {
    ref += "/replies";
  }

  // check if user wanna upload an image
  var imageFile = $(this).find("[name=image]")[0].files[0];
  if (imageFile) {
    uploadImage(imageFile, function(imageShareUrl) {
      imgSrc = imageShareUrl;
      sendComment(ref, timestamp, submitter, content, imgSrc);
    })
  } else {
    sendComment(ref, timestamp, submitter, content, imgSrc);
  }
});

function sendComment(ref, timestamp, submitter, content, imgSrc, done) {
  var newCommentRef = firebase.database().ref(ref).push();
  var task = newCommentRef.set({
    timestamp: timestamp,
    voteCount: 0,
    submitter: submitter,
    content: content,
    imgSrc: imgSrc,
    replies: null
  }, function complete() {
      // reload page so new comment shows... a cheat... lol
      window.location.reload(true);
      done();
    }
  );
}

function getOwnFullRefPathsFromDom($elem) {
  var refPaths = [];
  $elem.parents(".comment").each(function() {
    refPaths.push($(this).data("id"));
  });

  var ref = 'comments';
  if (refPaths.length > 0) {
    ref = ref + "/" + refPaths.reverse().join("/replies/");
  }

  return ref;
}

$("#comments").on("click", ".btn-reply", function(event) {
  var $reply = $(this).parent().find(".reply");
  $reply.html(generateNewCommentFormHtml($(this).data("id")));
});

$("#comments").on("click", "img", function(event) {
  var $comment = $(this).parents(".comment:eq(0)");
  var ref = getOwnFullRefPathsFromDom($(this));
  var $elemClicked = $(this);

  firebase.database().ref(ref).once('value').then(function(snapshot) {
    var currentCount = snapshot.val().voteCount;
    var newCount = currentCount;

    if ($elemClicked.hasClass("upvote")) { newCount++; }
    if ($elemClicked.hasClass("downvote")) { newCount--; }

    firebase.database().ref(ref).update({ voteCount: newCount });
    $comment.find(".count:eq(0)")[0].innerText = newCount;
  });
});
