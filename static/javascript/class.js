$(document).ready(function(){
    listClasses();
    $('.modal').modal({
    dismissible: true, // Modal can be dismissed by clicking outside of the modal
    opacity: .5, // Opacity of modal background
    inDuration: 300, // Transition in duration
    outDuration: 200, // Transition out duration
    startingTop: '4%', // Starting top style attribute
    endingTop: '10%' // Ending top style attribute
  });
});

function isValidEmailAddress() {
  var result = true;
    var pattern = /^([a-z\d!#$%&'*+\-\/=?^_`{|}~\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]+(\.[a-z\d!#$%&'*+\-\/=?^_`{|}~\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]+)*|"((([ \t]*\r\n)?[ \t]+)?([\x01-\x08\x0b\x0c\x0e-\x1f\x7f\x21\x23-\x5b\x5d-\x7e\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]|\\[\x01-\x09\x0b\x0c\x0d-\x7f\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]))*(([ \t]*\r\n)?[ \t]+)?")@(([a-z\d\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]|[a-z\d\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF][a-z\d\-._~\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]*[a-z\d\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])\.)+([a-z\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]|[a-z\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF][a-z\d\-._~\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]*[a-z\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])\.?$/i;
    $( ".student-email-container input[type=email]" ).each(function(i, email) {
      if($(email).val() != '' && !pattern.test($(email).val())) {
        result = false;
      }
    });
    return result;
};

function validateClassModalInput() {
  if(($(".class-name").val() != '') && isValidEmailAddress() && $("#class-date-alert").is(":hidden")) {
    $('#save-class').removeAttr('disabled');
  }else {
    $("#save-class").attr("disabled",true);
  }
}

function closeCurrentClassModal(id) {
  $("#"+id).modal('close');
}
function initDateForClass() {
  $("#save-class").attr("disabled",true);
  $('#class-date-alert').hide();
  var startDate = new Date();
  var endDate = new Date();
  var today = new Date();
  var currentMonth = today.getMonth()+1;
  var t = today.getFullYear() + "-" + currentMonth + "-" + today.getDate();
  $('#class-date-start').data({date: t}).datepicker('update');
  $('#class-date-start-display').text($('#class-date-start').data('date'));
  $('#class-date-end').data({date: t}).datepicker('update');
  $('#class-date-end-display').text($('#class-date-end').data('date'));
  checkClassDate(startDate, endDate);
}

function checkClassDate(startDate, endDate) {
  $('#class-date-start')
      .datepicker()
      .on('changeDate', function(ev){
          if (ev.date.valueOf() > endDate.valueOf()){
              $('#class-date-alert').show().find('strong').text('The start date must be before the end date.');
          } else {
              $('#class-date-alert').hide();
              startDate = new Date(ev.date);
              $('#class-date-start-display').text($('#class-date-start').data('date'));
          }
          $('#class-date-start').datepicker('hide');
          validateClassModalInput();
      });
  $('#class-date-end')
      .datepicker()
      .on('changeDate', function(ev){
          if (ev.date.valueOf() < startDate.valueOf()){
              $('#class-date-alert').show().find('strong').text('The end date must be after the start date.');
          } else {
              $('#class-date-alert').hide();
              endDate = new Date(ev.date);
              $('#class-date-end-display').text($('#class-date-end').data('date'));
          }
          $('#class-date-end').datepicker('hide');
          validateClassModalInput();
      });
}

function listClasses() {
    var listDiv = $('.class-list');
    $(".current-class-name").remove();

    $.ajax({
        url: '/ajax/list-class-list',
        type: 'post'
    }).done(function (data) {
        if(data.result === true) {
            var lists = data.list;
            listDiv.empty();
            for(var i in lists) {
                var listTemplate = new ClassGenerator();
                var div = $("<div class='col s6 m3'></div>");
                listDiv.append(div);
                listTemplate.init(div, lists[i]);
            }
        }else {
            console.error(data.reason);
        }
    }).fail(function (err) {
        console.error(err);
    });
}

function initClassModal() {
  $(".class-name").val('');
  initDateForClass();
  $(".student-list").empty();
  add_student();
  $(".delete-class-btn").hide();
  $(".save-class").attr("onclick","addClass()");
}

function addClass() {
  var name = $(".class-name").val();
  var startDate = $("#class-date-start-display").text();
  var endDate = $("#class-date-end-display").text();
  var students = [];
    $('.student-email').each(function() {
        if($(this).val() !== '') {
            students.push($(this).val());
        }
    });

    $.ajax({
        type: "POST",
        url: "/ajax/add-class",
        data: JSON.stringify({name: name, startDate: new Date(startDate), endDate: new Date(endDate), students: students}),
        success: function(data){
            if(data.result === true) {
                $('#class-detail').modal('close');
                listClasses();
            }else {
                console.error(data.reason);
            }
        },
        error: function(ts) {
            console.log(ts.responseText);
        },
        dataType: "json",
        contentType : "application/json"
    });
}

function viewClassInfo(current_class_id) {
  closeCurrentClassModal(current_class_id);
  $("#class-detail label").addClass("active");
  $(".student-email-container label").addClass("active");
  $.ajax({
      url: '/ajax/get-edit-class-info',
      type: 'post',
      data: JSON.stringify({classId: current_class_id}),
      contentType: "application/json; charset=utf-8",
      dataType: 'json'
  }).done(function (data) {
      if(data.result === true) {
        if(data.result4classInfo) {
          $(".class-name").val(data.classInfo.name);
          $('#class-date-alert').hide();
          var startDate = new Date(data.classInfo.startDate);
          var endDate = new Date(data.classInfo.endDate);
          var startMonth = startDate.getMonth()+1;
          var endMonth = endDate.getMonth()+1;
          var start = startDate.getFullYear() + "-" + startMonth + "-" + startDate.getDate();
          var end = endDate.getFullYear() + "-" + endMonth + "-" + endDate.getDate();
          $('#class-date-start').data({date: start}).datepicker('update');
          $('#class-date-start-display').text($('#class-date-start').data('date'));
          $('#class-date-end').data({date: end}).datepicker('update');
          $('#class-date-end-display').text($('#class-date-end').data('date'));
          checkClassDate(startDate, endDate);
          $("#save-class").attr("disabled",true);
        }else {
          console.error(data.reason);
        }
        if(data.result4Privilege) {
          $(".student-list").empty();
          display_students(data.privilegeList);
        }else {
          console.error(data.reason);
        }
        $(".save-class").attr("onclick","editClass('"+current_class_id+"')");
      }else {
          console.error(data.reason);
      }
  }).fail(function (err) {
      console.error(err);
  });
}

function editClass(current_class_id) {
  var name = $(".class-name").val();
  var startDate = $("#class-date-start-display").text();
  var endDate = $("#class-date-end-display").text();
  var students = [];
    $('.student-email').each(function() {
        if($(this).val() !== '') {
            students.push($(this).val());
        }
    });

    $.ajax({
        type: "POST",
        url: "/ajax/edit-class",
        data: JSON.stringify({classId: current_class_id, name: name, startDate: new Date(startDate), endDate: new Date(endDate), students: students}),
        success: function(data){
            if(data.result === true) {
                $('#class-detail').modal('close');
                listClasses();
            }else {
                console.error(data.reason);
            }
        },
        error: function(ts) {
            console.log(ts.responseText);
        },
        dataType: "json",
        contentType : "application/json"
    });
}

function deleteClass(current_class_id) {
  $.ajax({
      url: '/ajax/delete-class',
      type: 'post',
      data: JSON.stringify({classId: current_class_id}),
      contentType: "application/json; charset=utf-8",
      dataType: 'json'
  }).done(function (data) {
    if(!data.result) {
      console.error(data.reason);
    }
  }).fail(function (err) {
      console.error(err);
  });
}

function add_student() {
  $(".student-list").append("<div class='col s12 student-email-main-container'><div class='input-field student-email-container'><input type='email' class='student-email validate' oninput='validateClassModalInput()'><label for='email'>Email</label></div><a class='btn-floating btn-large red delete-student' onclick='deleteStudent(this)'><i class='material-icons left'>delete</i></a></div>");
}
function display_students(student_list) {
  $.each(student_list, function(key, value) {
    $(".student-list").append("<div class='col s12 student-email-main-container'><div class='input-field student-email-container'><input type='email' class='student-email validate' value="+ value.email + " oninput='validateClassModalInput()'><label for='email'>Email</label></div><a class='btn-floating btn-large red delete-student' onclick='deleteStudent(this)'><i class='material-icons left'>delete</i></a></div>");
  });
}

function deleteStudent(element) {
  $(element).parent().remove();
  validateClassModalInput();
}

function import_student() {
    var file = $('.bulk-import-student')[0].files[0];
    Papa.parse(file, {
        complete: function(results) {
            for(count = 0; count < results.data.length; count++){
                $(".student-list").append("<input type='text' class='student-email' value= '"+ results.data[count][1] + "'>");
            }
        }
    });
}
