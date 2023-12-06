//buttons.js

class Buttons{
    constructor(page){
        this.page = page

        const ids = [
            'trialSlider', 'colorbarLabel', 'channelDisplay', 'ANOVAbutton',
            'meanTrialsButton', 'excludeTrialButton',
            'prevChan', 'nextChan', 'yAxisLabel', 'trialNumber',
        ];
        
        ids.forEach(id => {
            this[id] = document.getElementById(id);
        });

    }

    updateDisplayStyle(elements, displayStyle) {
        elements.forEach(element => {
            element.style.display = displayStyle;
        });
    }
    
    set_groupButtons(){
        const groupButtons = document.querySelectorAll('.groupButton');
        this.page.excludedTrialsContainer = {}

        groupButtons.forEach((button) => {
            button.addEventListener('click', async (event) => {
                groupButtons.forEach(btn => btn.classList.remove('active'));

                event.target.classList.add('active'); 

                this.page.group = event.target.textContent;
                this.page.trial = 1;
            
                this.page.excludedContainers.forEach(container => container.style.display = 'none');
                this.page.excludedTrialsContainer[this.page.group].style.display = 'block'

                await this.page.getData();
        
                this.trialSlider.previousElementSibling.textContent = 'Trial:'
                this.channelDisplay.textContent = 'Channel 1' 
                document.getElementById('containerWrapper').style.display = 'block'
            })

        });

    }

    set_stimButtons(){
        const groupButtons = document.querySelectorAll('.groupButton');
        const stimGroups = document.querySelectorAll('.stimGroup')
        
        stimGroups.forEach(button => {
            button.addEventListener('click', (event) => {
                this.page.excludedContainers.forEach(container => container.style.display = 'none');
                document.title = document.getElementById('channelDisplay').textContent;
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
                    this.page.excludedTrialsContainer[button.textContent] = this.page.excludedContainers[index];

                })
              
            })
        })
    }

    set_channelButtons(){

        this.prevChan.addEventListener('click', () => {
            if (this.page.channel > 1) {
                this.page.channel--;
                this.channelDisplay.textContent = 'Channel' + this.page.channel;
                this.page.getData();
            }
        })
        
        this.nextChan.addEventListener('click', () => {
            this.page.channel++;
            this.channelDisplay.textContent = 'Channel' + this.page.channel;
            this.page.getData();
        })
      }
}
    
window.Buttons = Buttons;