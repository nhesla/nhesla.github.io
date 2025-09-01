import java.awt.*;   
import java.applet.Applet; 
import java.util.Random; 

public class Boomer_creep extends Creep
{
    public Boomer_creep(int x, int y, int h, int s, int d) 
    {
		super(x, y, h, s, d);
	}	
	
	public Boomer_creep(Creep copy, int d) 
    {
    	super(copy, d);
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
	    	else if(animation % 3 == 0)
	    		g.setColor(Color.red);
	    	else 
	    		g.setColor(Color.black);
	    		
	    	if(visible)
	    		g.fillArc(getX()-(20/diviser), getY()-(20/diviser), (40/diviser), (40/diviser), (0+animation)-direction, (360-animation*2));
	    	else
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
    		///explosion
    		Random randy = new Random();
    		
    		Polygon boom = new Polygon();
			boom.addPoint((int)(getX()+((randy.nextInt(50)+100)/diviser*Math.sin(0))),(int)(getY()+((randy.nextInt(50)+100)/diviser*Math.cos(0))));
			boom.addPoint((int)(getX()+((randy.nextInt(50)+100)/diviser*Math.sin(15))),(int)(getY()+((randy.nextInt(50)+100)/diviser*Math.cos(15))));
			boom.addPoint((int)(getX()+((randy.nextInt(50)+100)/diviser*Math.sin(30))),(int)(getY()+((randy.nextInt(50)+100)/diviser*Math.cos(30))));
			boom.addPoint((int)(getX()+((randy.nextInt(50)+100)/diviser*Math.sin(45))),(int)(getY()+((randy.nextInt(50)+100)/diviser*Math.cos(45))));
			boom.addPoint((int)(getX()+((randy.nextInt(50)+100)/diviser*Math.sin(60))),(int)(getY()+((randy.nextInt(50)+100)/diviser*Math.cos(60))));
			boom.addPoint((int)(getX()+((randy.nextInt(50)+100)/diviser*Math.sin(75))),(int)(getY()+((randy.nextInt(50)+100)/diviser*Math.cos(75))));
			boom.addPoint((int)(getX()+((randy.nextInt(50)+100)/diviser*Math.sin(90))),(int)(getY()+((randy.nextInt(50)+100)/diviser*Math.cos(90))));
			boom.addPoint((int)(getX()+((randy.nextInt(50)+100)/diviser*Math.sin(105))),(int)(getY()+((randy.nextInt(50)+100)/diviser*Math.cos(105))));
			boom.addPoint((int)(getX()+((randy.nextInt(50)+100)/diviser*Math.sin(120))),(int)(getY()+((randy.nextInt(50)+100)/diviser*Math.cos(120))));
			boom.addPoint((int)(getX()+((randy.nextInt(50)+100)/diviser*Math.sin(135))),(int)(getY()+((randy.nextInt(50)+100)/diviser*Math.cos(135))));
			boom.addPoint((int)(getX()+((randy.nextInt(50)+100)/diviser*Math.sin(150))),(int)(getY()+((randy.nextInt(50)+100)/diviser*Math.cos(150))));
			boom.addPoint((int)(getX()+((randy.nextInt(50)+100)/diviser*Math.sin(165))),(int)(getY()+((randy.nextInt(50)+100)/diviser*Math.cos(165))));
			boom.addPoint((int)(getX()+((randy.nextInt(50)+100)/diviser*Math.sin(180))),(int)(getY()+((randy.nextInt(50)+100)/diviser*Math.cos(180))));
			boom.addPoint((int)(getX()+((randy.nextInt(50)+100)/diviser*Math.sin(195))),(int)(getY()+((randy.nextInt(50)+100)/diviser*Math.cos(195))));
			boom.addPoint((int)(getX()+((randy.nextInt(50)+100)/diviser*Math.sin(210))),(int)(getY()+((randy.nextInt(50)+100)/diviser*Math.cos(210))));
			boom.addPoint((int)(getX()+((randy.nextInt(50)+100)/diviser*Math.sin(225))),(int)(getY()+((randy.nextInt(50)+100)/diviser*Math.cos(225))));
			boom.addPoint((int)(getX()+((randy.nextInt(50)+100)/diviser*Math.sin(240))),(int)(getY()+((randy.nextInt(50)+100)/diviser*Math.cos(240))));
			boom.addPoint((int)(getX()+((randy.nextInt(50)+100)/diviser*Math.sin(255))),(int)(getY()+((randy.nextInt(50)+100)/diviser*Math.cos(255))));
			boom.addPoint((int)(getX()+((randy.nextInt(50)+100)/diviser*Math.sin(270))),(int)(getY()+((randy.nextInt(50)+100)/diviser*Math.cos(270))));
			boom.addPoint((int)(getX()+((randy.nextInt(50)+100)/diviser*Math.sin(285))),(int)(getY()+((randy.nextInt(50)+100)/diviser*Math.cos(285))));
			boom.addPoint((int)(getX()+((randy.nextInt(50)+100)/diviser*Math.sin(300))),(int)(getY()+((randy.nextInt(50)+100)/diviser*Math.cos(300))));
			boom.addPoint((int)(getX()+((randy.nextInt(50)+100)/diviser*Math.sin(315))),(int)(getY()+((randy.nextInt(50)+100)/diviser*Math.cos(315))));
			boom.addPoint((int)(getX()+((randy.nextInt(50)+100)/diviser*Math.sin(330))),(int)(getY()+((randy.nextInt(50)+100)/diviser*Math.cos(330))));
			boom.addPoint((int)(getX()+((randy.nextInt(50)+100)/diviser*Math.sin(345))),(int)(getY()+((randy.nextInt(50)+100)/diviser*Math.cos(345))));
			boom.addPoint((int)(getX()+((randy.nextInt(50)+100)/diviser*Math.sin(360))),(int)(getY()+((randy.nextInt(50)+100)/diviser*Math.cos(360))));
			
			g.setColor(Color.red);
			g.fillPolygon(boom);
			
			animation --;
    	}
    		
    }
}