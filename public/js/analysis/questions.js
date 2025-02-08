document.addEventListener('DOMContentLoaded', () => {
    const state = {
        currentQuestion: 1,
        totalQuestions: 5
    };
    
    const elements = {
        nextBtn: document.getElementById('nextBtn'),
        prevBtn: document.getElementById('prevBtn'),
        progress: document.getElementById('progress'),
        questionCounter: document.getElementById('question-counter'),
        questions: Array.from({ length: 5 }, (_, i) => document.getElementById(`q${i + 1}`)),
        questionnaire: document.getElementById('questionnaire'),
        skinQuestionsForm: document.getElementById('skinQuestions'),
        cameraSection: document.getElementById('camera-section')
    };

    // Remove the form's default action and method
    elements.skinQuestionsForm.removeAttribute('action');
    elements.skinQuestionsForm.removeAttribute('method');

    function updateProgress() {
        const progressPercentage = ((state.currentQuestion - 1) / state.totalQuestions) * 100;
        elements.progress.style.width = `${progressPercentage}%`;
        elements.questionCounter.textContent = `Question ${state.currentQuestion} of ${state.totalQuestions}`;
    }
    
    function showQuestion(questionNumber) {
        elements.questions.forEach((q, index) => {
            q.classList.remove('active');
            if (index + 1 === questionNumber) {
                q.classList.add('active');
            }
        });
    
        elements.prevBtn.style.display = questionNumber === 1 ? 'none' : 'block';
        elements.nextBtn.textContent = questionNumber === state.totalQuestions ? 'Submit' : 'Next';
        updateProgress();
    }

    function submitForm() {
        // Create the data object manually
        const formData = {
            age: document.querySelector('select[name="age"]').value,
            skinFeel: document.querySelector('select[name="skinFeel"]').value,
            breakouts: document.querySelector('select[name="breakouts"]').value,
            sensitivity: document.querySelector('select[name="sensitivity"]').value,
            concern: document.querySelector('select[name="concern"]').value
        };

        // Validate data before sending
        for (let key in formData) {
            if (!formData[key]) {
                alert('Please fill all fields');
                return;
            }
        }

        console.log('Sending data:', formData);

        fetch('/analyze', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(formData)
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            console.log('Success:', data);
            // elements.questionnaire.style.display = 'none';
            // elements.cameraSection.style.display = 'block';
            window.location.href = '/analyze/face';
            
        })
        .catch((error) => {
            console.error('Error:', error);
            alert('Error submitting form');
        });
    }
    
    elements.nextBtn.addEventListener('click', function() {
        const currentSelect = document.querySelector('.question-container.active select');
        if (!currentSelect || !currentSelect.value) {
            alert('Please select an option');
            return;
        }

        if (state.currentQuestion < state.totalQuestions) {
            state.currentQuestion++;
            showQuestion(state.currentQuestion);
        } else {
            submitForm();
        }
    });
    
    elements.prevBtn.addEventListener('click', () => {
        if (state.currentQuestion > 1) {
            state.currentQuestion--;
            showQuestion(state.currentQuestion);
        }
    });

    // Prevent the default form submission
    elements.skinQuestionsForm.addEventListener('submit', (e) => {
        e.preventDefault();
        return false;
    });

    showQuestion(1);
});