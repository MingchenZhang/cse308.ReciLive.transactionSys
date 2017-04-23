/**
 * Created by jieliang on 4/5/17.
 */

var currentClass = null;

$(document).ready(function(){
    listClasses();

    $('#class-date-alert').hide();
    var startDate = new Date();
    var endDate = new Date();
    var today = new Date();
    var t = today.getFullYear() + "-" + today.getMonth() + "-" + today.getDate();
    $('#class-date-start').data({date: t}).datepicker('update');
    $('#class-date-start-display').text($('#class-date-start').data('date'));
    $('#class-date-end').data({date: t}).datepicker('update');
    $('#class-date-end-display').text($('#class-date-end').data('date'));

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
        });

    // Recitation
    $('#rec-date-alert').hide();
    var startDate = new Date();
    var endDate = new Date();
    var today = new Date();
    var t = today.getFullYear() + "-" + today.getMonth() + "-" + today.getDate();
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
});

function getCookie(name) {
    var value = "; " + document.cookie;
    var parts = value.split("; " + name + "=");
    if (parts.length == 2) return parts.pop().split(";").shift();
}

function listClasses() {
    $(".add-class").css("display","inline-block");
    $(".add-recitation").css("display","none");
    var listDiv = $('.class-list');

    $.ajax({
        url: '/ajax/list-class-list',
        type: 'post',
        data: JSON.stringify({email: getCookie("email")}),
        contentType: "application/json; charset=utf-8",
        dataType: 'json'
    }).done(function (data) {
        if(data.result === true) {
            var lists = data.list;
            listDiv.empty();
            for(var i in lists) {
                var listTemplate = new ClassGenerator();
                var div = $("<div class='col-md-3 col-sm-6'></div>");
                listDiv.append(div);
                listTemplate.init(div, lists[i]);
            }
        }else {
            console.error(data.error);
        }
    }).fail(function (err) {
        console.error(err);
    });
}

function addClass() {
    var name = $(".class-name").val();
    var startDate = $("#class-date-start-display").text();
    var endDate = $("#class-date-end-display").text();
    var createAt = new Date();
    var students = [];
    $('.student-email').each(function() {
        if($(this).val() !== '') {
            students.push($(this).val());
        }
    });

    $.ajax({
        type: "POST",
        url: "/ajax/add-class",
        data: JSON.stringify({name: name, owner: getCookie("email"), startDate: new Date(startDate), endDate: new Date(endDate), createAt: new Date(createAt), students: students}),
        success: function(data){
            if(data.result === true) {
                $('#class-detail').modal('hide');
                listClasses();
            }else {
                console.error(data.error);
            }
        },
        error: function(ts) {
            console.log(ts.responseText);
        },
        dataType: "json",
        contentType : "application/json"
    });
}

function listRecitation(current_class) {
    $(".add-class").css("display","none");
    $(".add-recitation").css("display","inline-block");
    var listDiv = $('.class-list');

    $.ajax({
        url: '/ajax/list-recitation-list',
        type: 'post',
        data: JSON.stringify({class: current_class}),
        contentType: "application/json; charset=utf-8",
        dataType: 'json'
    }).done(function (data) {
        if(data.result === true) {
            currentClass = current_class;
            var lists = data.list;
            listDiv.empty();
            for(var i in lists) {
                var listTemplate = new RecitationGenerator();
                var div = $("<div class='col-md-3 col-sm-6'></div>");
                listDiv.append(div);
                listTemplate.init(div, lists[i], i);
            }
        }else {
            console.error(data.error);
        }
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
        data: JSON.stringify({class: currentClass, name: name, startDate: new Date(startDate), endDate: new Date(endDate), createAt: new Date(createAt)}),
        success: function(data){
            if(data.result === true) {
                $('#recitation-detail').modal('hide');
                listRecitation(currentClass);
            }else {
                console.error(data.error);
            }
        },
        error: function(ts) {
            console.log(ts.responseText);
        },
        dataType: "json",
        contentType : "application/json"
    });
}


function add_student() {
    $(".student-list").append("<input type='text' class='student-email'>");
}

function import_student() {
    var file = $('.bulk-import-student')[0].files[0];

    Papa.parse(file, {
        complete: function(results) {
            console.log(results.data);

            for(count = 0; count < results.data.length; count++){
                $(".student-list").append("<input type='text' class='student-email' value= '"+ results.data[count][1] + "'>");

            }

        }
    });

}
