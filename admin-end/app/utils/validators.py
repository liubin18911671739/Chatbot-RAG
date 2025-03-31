from flask_wtf import FlaskForm
from wtforms import StringField, FileField, SelectField, SubmitField
from wtforms.validators import DataRequired, Length, FileRequired, FileAllowed

class DocumentUploadForm(FlaskForm):
    title = StringField('Document Title', validators=[DataRequired(), Length(max=100)])
    file = FileField('Upload Document', validators=[
        FileRequired(),
        FileAllowed(['pdf', 'docx', 'txt'], 'Documents only!')
    ])
    category = SelectField('Category', choices=[], validators=[DataRequired()])
    submit = SubmitField('Upload')