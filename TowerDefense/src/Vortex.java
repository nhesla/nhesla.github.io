import java.awt.*;   
import java.applet.Applet; 
import java.util.Random; 

public class Vortex extends Thing
{
	protected int animation;
	
	public Vortex(int x, int y, int d)
	{
		super(x,y,d);
		
		animation = 1000;
	}
	public Vortex(Vortex copy, int d)
	{
		super(copy.getX(), copy.getY(), d);
		animation = copy.getA();
	}
	
	public int getA()
	{
		return animation;
	}
	
	public void drawVortex(Graphics g)
	{
		/////////blackhole animation///////////
		if(animation > 0)
		{
			g.setColor(Color.black);
			g.fillOval(getX()-(25/diviser),getY()-(25/diviser),(50/diviser),(50/diviser));
			
			Polygon swirl = new Polygon();
			swirl.addPoint((int)((getX()+(5/diviser)*Math.sin(animation%360))-(2/diviser)*Math.cos(animation%360)),(int)((getY()-(2/diviser)*Math.sin(animation%360))-(5/diviser)*Math.cos(animation%360)));
       		swirl.addPoint((int)((getX()+(20/diviser)*Math.sin(animation%360))+(5/diviser)*Math.cos(animation%360)),(int)((getY()+(5/diviser)*Math.sin(animation%360))-(20/diviser)*Math.cos(animation%360)));
       		swirl.addPoint((int)((getX()+(15/diviser)*Math.sin(animation%360))+(20/diviser)*Math.cos(animation%360)),(int)((getY()+(20/diviser)*Math.sin(animation%360))-(15/diviser)*Math.cos(animation%360)));
       		swirl.addPoint((int)((getX()+(10/diviser)*Math.sin(animation%360))+(10/diviser)*Math.cos(animation%360)),(int)((getY()+(10/diviser)*Math.sin(animation%360))-(10/diviser)*Math.cos(animation%360)));
       		swirl.addPoint((int)((getX()+(2/diviser)*Math.sin(animation%360))+(5/diviser)*Math.cos(animation%360)),(int)((getY()+(5/diviser)*Math.sin(animation%360))-(2/diviser)*Math.cos(animation%360)));
       		swirl.addPoint((int)((getX()-(8/diviser)*Math.sin(animation%360))+(15/diviser)*Math.cos(animation%360)),(int)((getY()+(15/diviser)*Math.sin(animation%360))+(8/diviser)*Math.cos(animation%360)));
       		swirl.addPoint((int)((getX()-(24/diviser)*Math.sin(animation%360))+(5/diviser)*Math.cos(animation%360)),(int)((getY()+(5/diviser)*Math.sin(animation%360))+(24/diviser)*Math.cos(animation%360)));
       		swirl.addPoint((int)((getX()-(12/diviser)*Math.sin(animation%360))+(7/diviser)*Math.cos(animation%360)),(int)((getY()+(7/diviser)*Math.sin(animation%360))+(12/diviser)*Math.cos(animation%360)));
       		swirl.addPoint((int)((getX()-(5/diviser)*Math.sin(animation%360))-(2/diviser)*Math.cos(animation%360)),(int)((getY()-(2/diviser)*Math.sin(animation%360))+(5/diviser)*Math.cos(animation%360)));
       		swirl.addPoint((int)((getX()-(7/diviser)*Math.sin(animation%360))-(16/diviser)*Math.cos(animation%360)),(int)((getY()-(16/diviser)*Math.sin(animation%360))+(7/diviser)*Math.cos(animation%360)));
       		swirl.addPoint((int)((getX()+(11/diviser)*Math.sin(animation%360))-(20/diviser)*Math.cos(animation%360)),(int)((getY()-(20/diviser)*Math.sin(animation%360))-(11/diviser)*Math.cos(animation%360)));
       		swirl.addPoint((int)((getX()+(0/diviser)*Math.sin(animation%360))-(14/diviser)*Math.cos(animation%360)),(int)((getY()-(14/diviser)*Math.sin(animation%360))-(0/diviser)*Math.cos(animation%360)));
       		swirl.addPoint((int)((getX()+(5/diviser)*Math.sin(animation%360))+(0/diviser)*Math.cos(animation%360)),(int)((getY()+(0/diviser)*Math.sin(animation%360))-(5/diviser)*Math.cos(animation%360)));
       		
       		g.setColor(new Color(100,0,200));
       		g.fillPolygon(swirl);
       		
       		animation -= 5;
		}
	}
}