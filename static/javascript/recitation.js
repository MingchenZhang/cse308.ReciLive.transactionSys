function initRecModal(classId) {
  $(".recitation-name").val('');
  initDateForRec();
  $(".delete-recitation-btn").hide();
  $(".save-recitaiton").attr("onclick","addRecitation('"+classId+"')");
}

function validateRecitationModalInput() {
  if($(".recitation-name").val() != '' && $("#rec-date-alert").is(":hidden")) {
    $('.save-recitaiton').removeAttr('disabled');
  }else {
    $(".save-recitaiton").attr("disabled",true);
  }
}

function initDateForRec() {
  $(".save-recitaiton").attr("disabled",true);
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
  checkRecitationDate(startDate, endDate);
}

function checkRecitationDate(startDate, endDate) {
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
          validateRecitationModalInput();
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
          validateRecitationModalInput();
      });
}

function listRecitation(currentClassId) {
    $(".halfway-fab").attr("href","#recitation-detail");
    $(".halfway-fab").attr("onclick","initRecModal('"+currentClassId+"')");
    var listDiv = $('.class-list');
    $(".current-class-name").remove();

    $.ajax({
        url: '/ajax/list-recitation-list',
        type: 'post',
        data: JSON.stringify({class: currentClassId}),
        contentType: "application/json; charset=utf-8",
        dataType: 'json'
    }).done(function (data) {
        if(data.result === true) {
            currentClassId = currentClassId;
            var lists = data.list;
            listDiv.empty();
            for(var i in lists) {
                var listTemplate = new RecitationGenerator();
                var div = $("<div class='col s6 m3'></div>");
                listDiv.append(div);
                listTemplate.init(div, lists[i], currentClassId);
            }
        }else {
            console.error(data.reason);
        }
    }).fail(function (err) {
        console.error(err);
    });
}

function viewRecitationInfo(current_recitation_id, currentClassId) {
  closeCurrentClassModal(current_recitation_id);
  $("#recitation-detail label").addClass("active");
  $.ajax({
      url: '/ajax/get-recitation-info',
      type: 'post',
      data: JSON.stringify({recitationId: current_recitation_id}),
      contentType: "application/json; charset=utf-8",
      dataType: 'json'
  }).done(function (data) {
      if(data.result === true) {
        $(".recitation-name").val(data.recitation.name);
        $('#rec-date-alert').hide();
        var startDate = new Date(data.recitation.startDate);
        var endDate = new Date(data.recitation.endDate);
        var startMonth = startDate.getMonth()+1;
        var endMonth = endDate.getMonth()+1;
        var start = startDate.getFullYear() + "-" + startMonth + "-" + startDate.getDate();
        var end = endDate.getFullYear() + "-" + endMonth + "-" + endDate.getDate();
        $('#rec-date-start').data({date: start}).datepicker('update');
        $('#rec-date-start-display').text($('#rec-date-start').data('date'));
        $('#rec-date-end').data({date: end}).datepicker('update');
        $('#rec-date-end-display').text($('#rec-date-end').data('date'));
        checkRecitationDate(startDate, endDate);

        $(".save-recitaiton").attr("onclick","editRecitation('"+current_recitation_id+"','"+currentClassId+"')");
      }else {
          console.error(data.reason);
      }
  }).fail(function (err) {
      console.error(err);
  });
}

function deleteRecitation(recID, classId) {
  $.ajax({
      url: '/ajax/delete-recitation',
      type: 'post',
      data: JSON.stringify({recitationId: recID}),
      contentType: "application/json; charset=utf-8",
      dataType: 'json'
  }).done(function (data) {
    closeCurrentClassModal(recID);
    listRecitation(classId);
  }).fail(function (err) {
      console.error(err);
  });
}

function addRecitation(currentClassId) {
    var name = $(".recitation-name").val();
    var startDate = $('#rec-date-start-display').text();;
    var endDate = $('#rec-date-end-display').text();;

    $.ajax({
        type: "POST",
        url: "/ajax/add-recitation",
        data: JSON.stringify({class: currentClassId, name: name, startDate: new Date(startDate), endDate: new Date(endDate)}),
        success: function(data){
            if(data.result === true) {
                $('#recitation-detail').modal('close');
                listRecitation(currentClassId);
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

function editRecitation(current_recitation_id, currentClassId) {
  var name = $(".recitation-name").val();
  var startDate = $("#rec-date-start-display").text();
  var endDate = $("#rec-date-end-display").text();

  $.ajax({
      type: "POST",
      url: "/ajax/edit-recitation",
      data: JSON.stringify({recitationId: current_recitation_id, name: name, startDate: new Date(startDate), endDate: new Date(endDate)}),
      success: function(data){
          if(data.result === true) {
              $('#recitation-detail').modal('close');
              listRecitation(currentClassId);
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
