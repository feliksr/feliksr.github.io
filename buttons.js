//buttons.js

class Buttons{
    constructor(page){
        this.page = page

        const ids = [
            'trialSlider', 'channelDisplay', 'excludeTrialButton', 'prevChan', 'nextChan', 'trialNumber', 'ANOVAscroll', 
            'allANOVA', 'pVal', 'pValDiv', 'trialScroll', 'channelScroll', 'channelNumber', 'channelButtonContainer', 
        ];
        
        ids.forEach(id => {
            this[id] = document.getElementById(id);
        });

        this.excludedContainers =  document.querySelectorAll('.excluded-trials-container');
        this.excludedContainers.forEach(container => container.style.display = 'none');
    }

    initialize(){

        this.set_channelButtons()
        this.set_stimButtons()
        this.set_groupButtons()
        this.set_ANOVA()
        this.set_allANOVA()
        this.set_excludeTrialsButton()
        this.set_homeButton()
        // this.set_uploadButton()
        // this.set_meanTrials()
    }


    set_homeButton(){
        document.getElementById('homeButton').addEventListener('click', () => {
            
            document.querySelectorAll('.groupButton').forEach(button => {
               
                    button.classList.remove('active');
                    button.disabled = false;

            });
        })
    }

    set_groupButtons(){

        const groupButtons = document.querySelectorAll('.groupButton');
        this.excludedTrialsContainer = {}

        groupButtons.forEach((button) => {
            button.addEventListener('click', async (event) => {
                groupButtons.forEach(btn => btn.classList.remove('active'));

                event.target.classList.add('active'); 

                this.page.group = event.target.textContent;
                this.page.trial = 0;
            
                this.excludedContainers.forEach(container => container.style.display = 'none');
                this.excludedTrialsContainer[this.page.group].style.display = 'block'

                await this.page.get_ChannelNumbers()
                this.channelDisplay.textContent = `Channel ${this.page.chanNumbers[this.page.channelIdx]} ${this.page.chanLabels[this.page.channelIdx]}`;

                await this.page.getData();
        
                this.trialSlider.previousElementSibling.textContent = 'Trial:'
                document.getElementById('containerWrapper').style.display = 'block'
            })
        });
    }

    set_uploadButton(){

        this.uploadButton.addEventListener('click', function() {
            this.fileInput.click();
        });
        
        this.fileInput.addEventListener('change', function() {
            let file = this.files[0];
            if (file) {
                console.log("File selected:", file.name);
                this.page.allWaveletTrials = file
                this.trialSlider.max = Object.keys(this.allWaveletTrials).length-1;
                this.trialSlider.disabled = false;
                this.page.singleTrialWavelet = this.page.allWaveletTrials[this.page.trial];

            }
        });
    }


    set_stimButtons(){

        const groupButtons = document.querySelectorAll('.groupButton');
        const stimGroups = document.querySelectorAll('.stimGroup')
        
        stimGroups.forEach(button => {
            button.addEventListener('click', (event) => {
                this.excludedContainers.forEach(container => container.style.display = 'none');
                document.getElementById("loadingText").style.display = "none";  // Hide "Loading..."
                document.getElementById('indexView').style.display = 'none';
                document.getElementById('heatmapView').style.display = 'block';

                document.getElementById('containerWrapper').style.display = 'none'
                this.trialSlider.previousElementSibling.textContent = ''

                this.page.stimGroup = event.target.textContent
                this.allGroups = this.page.groupTypes[this.page.stimGroup]
                groupButtons.forEach((button,index) => {
                    button.textContent = this.allGroups[index];
                    button.classList.remove('active')
                    this.excludedTrialsContainer[button.textContent] = this.excludedContainers[index];

                })
            })
        })
    }

    set_excludeTrialsButton(){

        this.excludeTrialButton.addEventListener('click', () => {
            const trialButtonId = `trialButton-${this.page.group}-${this.page.trial}`;
            const trialButton = document.getElementById(trialButtonId);

        
            if (trialButton) {
                this.excludeTrialButton.classList.add('active');
            } else {
                this.excludeTrialButton.classList.remove('active');
            }
        

            if (trialButton) {
                this.excludedTrialsContainer[this.page.group].removeChild(trialButton);
            } else {

                const button = document.createElement('button');
                button.textContent = `Trial ${this.page.trial}`;
                button.id = trialButtonId;
                this.excludedTrialsContainer[this.page.group].appendChild(button);
        
                button.addEventListener('click', () => {

                    this.trialSlider.value = parseInt(trialButtonId.split('-')[2]);
                    this.trialSlider.dispatchEvent(new Event('input'));

                });
            }
            
            this.excludeTrialButton.classList.toggle('active');
            this.page.getData();
        }); 
    }

    set_channelButtons(){

        this.prevChan.addEventListener('click', () => {

            if (this.page.channelIdx > 0) {
                this.page.channelIdx--;
                this.channelDisplay.textContent = `Channel ${this.page.chanNumbers[this.page.channelIdx]} ${this.page.chanLabels[this.page.channelIdx]}`;

                this.page.getData();
            }
        })
        
        this.nextChan.addEventListener('click', () => {

            this.page.channelIdx++;
            this.channelDisplay.textContent = `Channel ${this.page.chanNumbers[this.page.channelIdx]} ${this.page.chanLabels[this.page.channelIdx]}`;

            this.page.getData();
        })
    }


    set_ANOVA(){

        document.querySelectorAll('.ANOVAbutton').forEach(button => {

            button.addEventListener('click', () => {
                document.querySelectorAll('.ANOVAbutton').forEach(button => {
                    button.classList.toggle('active');
                })

                this.page.ANOVA = !this.page.ANOVA; 
                
                if (this.page.ANOVA) {

                    this.pValDiv.style.display = 'inline-block'
                    this.trialScroll.style.display = 'none'
                    this.channelScroll.style.display = 'none'
                    this.ANOVAscroll.style.display = 'none'

                    this.excludedContainers.forEach(container => container.style.display = 'flex');
    
                } else {
    
                    this.pValDiv.style.display = 'none'
                    this.channelScroll.style.display = 'none'
                    this.ANOVAscroll.style.display = 'none'
                    this.trialScroll.style.display = 'inline'

                       
                    this.excludedContainers.forEach(container => container.style.display = 'none');
                    this.excludedTrialsContainer[this.page.group].style.display= 'flex'  
                }
    
                // disables and greys out trial groups buttons when ANOVA button pressed 
                document.querySelectorAll('.groupButton').forEach(button => {

                    if (button.textContent !== this.page.group) {
                        button.classList.toggle('active');
                    }

                    button.disabled = !button.disabled;

                });
    
                this.page.trial = 0;
                this.page.getData();

            });
        });
    }


    set_allANOVA(){

        this.allANOVA.addEventListener('click', async () =>{

            document.querySelectorAll('.ANOVAbutton').forEach(button => {
                button.disabled = !button.disabled 
            })

            this.allANOVA.classList.toggle('active');
            this.page.allANOVA = !this.page.allANOVA; 
            
            await this.page.getData();
            
            if (this.page.allANOVA){
                this.channelButtonContainer.style.display = 'none' ;
                this.ANOVAscroll.style.display = 'flex'

            }else{

                this.ANOVAscroll.style.display = 'none'
                this.channelButtonContainer.style.display = 'flex' ;
    
            }
        })
    }
}
    
window.Buttons = Buttons;