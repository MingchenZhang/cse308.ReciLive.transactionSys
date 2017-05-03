var currentClassId = null;
var currentClassName = null;

function initRecModal() {
  $(".recitation-name").val('');
  initDateForRec();
  $(".delete-recitation-btn").hide();
  $(".save-recitaiton").attr("onclick","addRecitation()");
}
function initDateForRec() {
  $('#rec-date-alert').hide();
  var startDate = new Date();
  var endDate = new Date();
  var today = new Date();
  var currentMonth = today.getMonth()+1;
  var t = today.getFullYear() + "-" + currentMonth + "-" + today.getDate();
  $('#rec-date-start').data({date: t}).datepicker('update');
  $('#rec-date-start-display').text($('#rec-date-start').data('date'));
  $('#rec-date-end').data({date: t}).datepicker('update');
  $('#rec-date-end-display').text($('#rec-date-end').data('date'));

  $('#rec-date-start')
      .datepicker()
      .on('changeDate', function(ev){
          if (ev.date.valueOf() > endDate.valueOf()){
              $('#rec-date-alert').show().find('strong').text('The start date must be before the end date.');
          } else {
              $('#rec-date-alert').hide();
              startDate = new Date(ev.date);
              $('#rec-date-start-display').text($('#rec-date-start').data('date'));
          }
          $('#rec-date-start').datepicker('hide');
      });
  $('#rec-date-end')
      .datepicker()
      .on('changeDate', function(ev){
          if (ev.date.valueOf() < startDate.valueOf()){
              $('#rec-date-alert').show().find('strong').text('The end date must be after the start date.');
          } else {
              $('#rec-date-alert').hide();
              endDate = new Date(ev.date);
              $('#rec-date-end-display').text($('#rec-date-end').data('date'));
          }
          $('#rec-date-end').datepicker('hide');
      });
}

function listRecitation(current_class_id, current_class_name) {
    $(".halfway-fab").attr("href","#recitation-detail");
    $(".halfway-fab").attr("onclick","initRecModal()");
    var listDiv = $('.class-list');
    $(".current-class-name").remove();
    $('.class-info').prepend("<h2 class='current-class-name'>"+current_class_name+"</h2>");

    $.ajax({
        url: '/ajax/list-recitation-list',
        type: 'post',
        data: JSON.stringify({class: current_class_id}),
        contentType: "application/json; charset=utf-8",
        dataType: 'json'
    }).done(function (data) {
        if(data.result === true) {
            currentClassId = current_class_id;
            currentClassName = current_class_name;
            var lists = data.list;
            listDiv.empty();
            for(var i in lists) {
                var listTemplate = new RecitationGenerator();
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

function viewRecitationInfo(current_recitation_id) {
  $.ajax({
      url: '/ajax/get-recitation-info',
      type: 'post',
      data: JSON.stringify({recitationId: current_recitation_id}),
      contentType: "application/json; charset=utf-8",
      dataType: 'json'
  }).done(function (data) {
      if(data.result === true) {
        $(".recitation-name").val(data.classInfo.name);
        $("#rec-date-start-display").text(data.classInfo.startDate.split("T")[0]);
        $('#rec-date-end-display').text(data.classInfo.endDate.split("T")[0]);
        $(".delete-recitation-btn").show();
        $(".save-recitaiton").attr("onclick","editRecitation('"+current_recitation_id+"')");
      }else {
          console.error(data.reason);
      }
      if(data.result4Privilege) {
          display_students(data.privilegeList);
      }else {
          console.error(data.reason);
      }
  }).fail(function (err) {
      console.error(err);
  });
}

function deleteRecitation(recID) {
  $.ajax({
      url: '/ajax/delete-recitation',
      type: 'post',
      data: JSON.stringify({recitationId: recID}),
      contentType: "application/json; charset=utf-8",
      dataType: 'json'
  }).done(function (data) {
  }).fail(function (err) {
      console.error(err);
  });
}

function addRecitation() {
    var name = $(".recitation-name").val();
    var startDate = $('#rec-date-start-display').text();;
    var endDate = $('#rec-date-end-display').text();;
    var createAt = new Date();

    $.ajax({
        type: "POST",
        url: "/ajax/add-recitation",
        data: JSON.stringify({class: currentClassId, name: name, startDate: new Date(startDate), endDate: new Date(endDate), createAt: new Date(createAt)}),
        success: function(data){
            if(data.result === true) {
                $('#recitation-detail').modal('close');
                listRecitation(currentClassId, currentClassName);
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

function editRecitation(current_recitation_id) {
  var name = $(".recitation-name").val();
  var startDate = $("#rec-date-start-display").text();
  var endDate = $("#rec-date-end-display").text();

  $.ajax({
      type: "POST",
      url: "/ajax/edit-recitation",
      data: JSON.stringify({class: current_recitation_id, name: name, startDate: new Date(startDate), endDate: new Date(endDate), createAt: new Date(createAt)}),
      success: function(data){
          if(data.result === true) {
              $('#recitation-detail').modal('close');
              listRecitation(currentClassId, currentClassName);
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
