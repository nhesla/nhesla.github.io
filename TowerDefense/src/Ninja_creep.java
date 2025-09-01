import java.awt.*;   
import java.applet.Applet;  
import java.util.Random; 

public class Ninja_creep extends Creep
{
    public Ninja_creep(int x, int y, int h, int s, int d) 
    {
		super(x, y, h, s, d);
	}	
		
	public Ninja_creep(Creep copy, int d)
    {
    	super(copy, d);
    }
		
	public void run(int checkX, int checkY)
    {
	    if(health > 0)
	    {
	    	double a = checkX - getX();
	    	double b = checkY - getY();
	    	double c = Math.hypot(a,b);
	    	
	    	direction = (int)Math.toDegrees(a/c);
	    	
	    	int timesX = 1, timesY = 1;
	    	
	    	if(checkX-getX() < 0)
	    		timesX = -1;
	    		
	    	if(checkY-getY() < 0)
	    		timesY = -1;
	    	
	    	setNV();
	    	
	    	if(frozen % 2 == 0)
	    	{
	    		setX((int) Math.min(Math.abs(speed*(a/c)),Math.abs(checkX - getX()))*timesX);
	    		setY((int) Math.min(Math.abs(speed*(b/c)),Math.abs(checkY - getY()))*timesY);
	    	}
	    	
	    	if(frozen > 0)
	    		frozen --;
	    		
	    	if(burned % 2 == 1)
	    		takeDamage(1);
	    		
	    	if(burned > 0)
	    		burned --;
	    	
	    	if(getX() == checkX && getY() == checkY && checkPoint != 19)
	    		checkPoint ++;
	    		
	    	if(getX() == checkX && getY() == checkY && checkPoint == 19)
	    	{
	    		health = 0;
	    		animation = 0;
	    		goal = true;
	    	}
	    }
    }
    
    public void drawCreep(Graphics g)
    {
	    if(health > 0) 
	    {
	    	if(hurt)
	    	{
	    		g.setColor(Color.gray);
	    		hurt = !hurt;
	    	}	
	    	else if(burned > 0)
	    		g.setColor(Color.orange);
	    	else if(frozen > 0)
	    		g.setColor(Color.cyan);
	    	else
	    		g.setColor(Color.darkGray);
	    		
	    	if(visible)
	    		g.fillArc(getX()-(20/diviser), getY()-(20/diviser), (40/diviser), (40/diviser), (0+animation)-direction, (360-animation*2));
	    	
	    	g.setColor(Color.black);
	    	g.drawArc(getX()-(20/diviser), getY()-(20/diviser), (40/diviser), (40/diviser), (0+animation)-direction, (360-animation*2));
	    	
	    	g.setColor(Color.green);
	    	g.setFont(new Font("Courier", Font.BOLD, (18/diviser)));
	        g.drawString(""+health,getX()-(10/diviser),getY()-(20/diviser));
	    	
	    	if(animation >= 30)
	    		animate = -1;
	    	
	    	if(animation <= -0)
	    		animate = 1;
	    		
	    	animation += animate*10;
	    }
	    else
	    {
	    	if(animation >= 0)
			{
				g.setColor(Color.gray);
				g.fillArc(getX()-(20/diviser), getY()-(20/diviser), (40/diviser), (40/diviser), 90+(180-animation*15), 360-(360-animation*30));
		    	
		    	animation --;
			}
	    }
    }
}